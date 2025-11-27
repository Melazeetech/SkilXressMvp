-- 1. Create the notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('like', 'follow', 'booking', 'message')) not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.notifications enable row level security;

-- 3. Create policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- 4. Create function to handle new likes
create or replace function public.handle_new_like()
returns trigger as $$
declare
  video_owner_id uuid;
  video_title text;
  liker_name text;
begin
  -- Get video details
  select provider_id, title into video_owner_id, video_title
  from public.skill_videos
  where id = new.video_id;

  -- Get liker details
  select full_name into liker_name
  from public.profiles
  where id = new.user_id;

  -- Only notify if liker is not the owner
  if video_owner_id != new.user_id then
    insert into public.notifications (user_id, type, title, message, data)
    values (
      video_owner_id,
      'like',
      'New Like',
      coalesce(liker_name, 'Someone') || ' liked your video "' || coalesce(video_title, 'Untitled') || '"',
      jsonb_build_object('video_id', new.video_id, 'like_id', new.id)
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 5. Create trigger for likes
drop trigger if exists on_new_like on public.video_likes;
create trigger on_new_like
  after insert on public.video_likes
  for each row execute procedure public.handle_new_like();

-- 6. Create function to handle new followers
create or replace function public.handle_new_follower()
returns trigger as $$
declare
  follower_name text;
begin
  -- Get follower details
  select full_name into follower_name
  from public.profiles
  where id = new.follower_id;

  insert into public.notifications (user_id, type, title, message, data)
  values (
    new.following_id,
    'follow',
    'New Follower',
    coalesce(follower_name, 'Someone') || ' started following you',
    jsonb_build_object('follower_id', new.follower_id)
  );
  return new;
end;
$$ language plpgsql security definer;

-- 7. Create trigger for followers
drop trigger if exists on_new_follower on public.followers;
create trigger on_new_follower
  after insert on public.followers
  for each row execute procedure public.handle_new_follower();

-- 8. Create function to handle booking updates
create or replace function public.handle_booking_update()
returns trigger as $$
declare
  client_name text;
  provider_name text;
  recipient_id uuid;
  other_name text;
begin
  -- Get names
  select full_name into client_name from public.profiles where id = new.client_id;
  select full_name into provider_name from public.profiles where id = new.provider_id;

  -- Notify Client
  insert into public.notifications (user_id, type, title, message, data)
  values (
    new.client_id,
    'booking',
    'Booking Update',
    'Booking with ' || coalesce(provider_name, 'Provider') || ' is now ' || new.status,
    jsonb_build_object('booking_id', new.id, 'role', 'client')
  );

  -- Notify Provider (only if status changed)
  insert into public.notifications (user_id, type, title, message, data)
  values (
    new.provider_id,
    'booking',
    'Booking Update',
    'Booking with ' || coalesce(client_name, 'Client') || ' is now ' || new.status,
    jsonb_build_object('booking_id', new.id, 'role', 'provider')
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- 9. Create trigger for bookings
drop trigger if exists on_booking_update on public.bookings;
create trigger on_booking_update
  after update of status on public.bookings
  for each row execute procedure public.handle_booking_update();

-- 10. Create trigger for new bookings (insert)
create or replace function public.handle_new_booking()
returns trigger as $$
declare
  client_name text;
begin
  select full_name into client_name from public.profiles where id = new.client_id;

  -- Notify Provider
  insert into public.notifications (user_id, type, title, message, data)
  values (
    new.provider_id,
    'booking',
    'New Booking Request',
    'New booking request from ' || coalesce(client_name, 'Client'),
    jsonb_build_object('booking_id', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_booking on public.bookings;
create trigger on_new_booking
  after insert on public.bookings
  for each row execute procedure public.handle_new_booking();
