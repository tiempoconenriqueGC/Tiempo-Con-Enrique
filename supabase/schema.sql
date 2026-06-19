-- Tiempo Con Enrique
-- Ejecuta este archivo en Supabase SQL Editor.
-- No uses la secret key en el frontend.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'reader' check (role in ('reader', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  published_at timestamptz not null default now(),
  updated_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  status text not null default 'published' check (status in ('draft', 'published'))
);

create table if not exists public.article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.article_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create index if not exists articles_published_at_idx
  on public.articles (published_at desc);

create index if not exists article_images_article_id_sort_order_idx
  on public.article_images (article_id, sort_order);

create index if not exists article_likes_user_id_idx
  on public.article_likes (user_id);

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'reader')
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_article_like_summaries(article_ids uuid[])
returns table (
  article_id uuid,
  likes_count bigint,
  liked_by_current_user boolean
)
language sql
security definer
set search_path = public
as $$
  with requested as (
    select distinct unnest(article_ids) as article_id
  )
  select
    requested.article_id,
    count(article_likes.user_id)::bigint as likes_count,
    coalesce(bool_or(article_likes.user_id = auth.uid()), false) as liked_by_current_user
  from requested
  join public.articles
    on articles.id = requested.article_id
   and articles.status = 'published'
  left join public.article_likes
    on article_likes.article_id = requested.article_id
  group by requested.article_id;
$$;

create or replace function public.toggle_article_like(target_article_id uuid)
returns table (
  article_id uuid,
  likes_count bigint,
  liked_by_current_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Necesitas iniciar sesion para dar like.';
  end if;

  if not exists (
    select 1
    from public.articles
    where id = target_article_id
      and status = 'published'
  ) then
    raise exception 'La noticia no existe o no esta publicada.';
  end if;

  if exists (
    select 1
    from public.article_likes
    where article_likes.article_id = target_article_id
      and article_likes.user_id = current_user_id
  ) then
    delete from public.article_likes
    where article_likes.article_id = target_article_id
      and article_likes.user_id = current_user_id;
  else
    insert into public.article_likes (article_id, user_id)
    values (target_article_id, current_user_id);
  end if;

  return query
    select *
    from public.get_article_like_summaries(array[target_article_id]);
end;
$$;

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.article_images enable row level security;
alter table public.article_likes enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Anyone can read published articles" on public.articles;
create policy "Anyone can read published articles"
  on public.articles
  for select
  using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert articles" on public.articles;
create policy "Admins can insert articles"
  on public.articles
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update articles" on public.articles;
create policy "Admins can update articles"
  on public.articles
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete articles" on public.articles;
create policy "Admins can delete articles"
  on public.articles
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Anyone can read published article images" on public.article_images;
create policy "Anyone can read published article images"
  on public.article_images
  for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.articles
      where articles.id = article_images.article_id
        and articles.status = 'published'
    )
  );

drop policy if exists "Admins can insert article images" on public.article_images;
create policy "Admins can insert article images"
  on public.article_images
  for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update article images" on public.article_images;
create policy "Admins can update article images"
  on public.article_images
  for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete article images" on public.article_images;
create policy "Admins can delete article images"
  on public.article_images
  for delete
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own article likes" on public.article_likes;
create policy "Users can read own article likes"
  on public.article_likes
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users can like published articles" on public.article_likes;
create policy "Users can like published articles"
  on public.article_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.articles
      where articles.id = article_likes.article_id
        and articles.status = 'published'
    )
  );

drop policy if exists "Users can remove own article likes" on public.article_likes;
create policy "Users can remove own article likes"
  on public.article_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

grant execute on function public.get_article_like_summaries(uuid[]) to anon, authenticated;
grant execute on function public.toggle_article_like(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read news images" on storage.objects;
create policy "Anyone can read news images"
  on storage.objects
  for select
  using (bucket_id = 'news-images');

drop policy if exists "Admins can upload news images" on storage.objects;
create policy "Admins can upload news images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'news-images'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can update news images" on storage.objects;
create policy "Admins can update news images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'news-images'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'news-images'
    and public.is_admin(auth.uid())
  );

drop policy if exists "Admins can delete news images" on storage.objects;
create policy "Admins can delete news images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'news-images'
    and public.is_admin(auth.uid())
  );

-- Después de crear tu primer usuario en Supabase Auth, conviértelo en admin:
-- update public.profiles set role = 'admin' where email = 'tu-email@example.com';
