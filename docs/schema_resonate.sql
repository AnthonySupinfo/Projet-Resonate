--
-- PostgreSQL database dump
--

\restrict B6yE7QinzVBnz1cw3btPzfRtDf9voboTMImL1Edc3iCyCCqS9sDgod3dZW4LpNc

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: activitytypes; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.activitytypes AS ENUM (
    'LIKE_TRACK',
    'LIKE_ALBUM',
    'FOLLOW_PLAYLIST',
    'FOLLOW_USER',
    'CREATE_PLAYLIST',
    'ADD_TRACK_PLAYLIST',
    'REVIEW_ALBUM',
    'LIKE_REVIEW',
    'COMMENT_REVIEW'
);


ALTER TYPE public.activitytypes OWNER TO resonate_user;

--
-- Name: mediastatus; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.mediastatus AS ENUM (
    'PLANNED',
    'LISTENING',
    'COMPLETED',
    'DROPPED'
);


ALTER TYPE public.mediastatus OWNER TO resonate_user;

--
-- Name: messagestatus; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.messagestatus AS ENUM (
    'PENDING',
    'SENDING',
    'SENT',
    'INTERRUPTED'
);


ALTER TYPE public.messagestatus OWNER TO resonate_user;

--
-- Name: notificationtype; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.notificationtype AS ENUM (
    'LIKE',
    'COMMENT',
    'FOLLOW',
    'SYSTEM_MSG',
    'RECOMMANDATION'
);


ALTER TYPE public.notificationtype OWNER TO resonate_user;

--
-- Name: playlisttype; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.playlisttype AS ENUM (
    'DEFAULT',
    'CUSTOM',
    'ORIGINAL'
);


ALTER TYPE public.playlisttype OWNER TO resonate_user;

--
-- Name: reportstatus; Type: TYPE; Schema: public; Owner: resonate_user
--

CREATE TYPE public.reportstatus AS ENUM (
    'PENDING',
    'RESOLVED',
    'DISMISSED'
);


ALTER TYPE public.reportstatus OWNER TO resonate_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: album_search_cache; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.album_search_cache (
    id uuid NOT NULL,
    query character varying NOT NULL,
    results json NOT NULL,
    fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.album_search_cache OWNER TO resonate_user;

--
-- Name: albums; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.albums (
    id uuid NOT NULL,
    name character varying NOT NULL,
    title character varying,
    artist_name character varying NOT NULL,
    lastfm_url character varying,
    image character varying,
    fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    year integer
);


ALTER TABLE public.albums OWNER TO resonate_user;

--
-- Name: artists; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.artists (
    id uuid NOT NULL,
    name character varying NOT NULL,
    lastfm_url character varying,
    fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.artists OWNER TO resonate_user;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user1_id character varying NOT NULL,
    user2_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_user1_less_than_user2 CHECK (((user1_id)::text <= (user2_id)::text))
);


ALTER TABLE public.conversations OWNER TO resonate_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO resonate_user;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: follows; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.follows (
    follower_id character varying NOT NULL,
    following_id character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.follows OWNER TO resonate_user;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id character varying NOT NULL,
    content text NOT NULL,
    status public.messagestatus NOT NULL,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_updated boolean
);


ALTER TABLE public.messages OWNER TO resonate_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO resonate_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type public.notificationtype NOT NULL,
    message character varying,
    related_user_id character varying,
    related_review_id integer,
    is_read boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO resonate_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO resonate_user;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.oauth_accounts (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    provider character varying NOT NULL,
    provider_user_id character varying NOT NULL,
    provider_email character varying NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO resonate_user;

--
-- Name: playlists; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.playlists (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type public.playlisttype NOT NULL,
    name character varying(255) NOT NULL,
    cover_url character varying(512),
    description text,
    is_public boolean DEFAULT false NOT NULL,
    is_favorite boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.playlists OWNER TO resonate_user;

--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.playlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.playlists_id_seq OWNER TO resonate_user;

--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.refresh_tokens (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked boolean NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO resonate_user;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id character varying NOT NULL,
    review_id integer NOT NULL,
    reason text NOT NULL,
    status public.reportstatus DEFAULT 'PENDING'::public.reportstatus NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_by_id character varying,
    resolved_at timestamp with time zone
);


ALTER TABLE public.reports OWNER TO resonate_user;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO resonate_user;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: review_comments; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.review_comments (
    id integer NOT NULL,
    review_id integer NOT NULL,
    user_id character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    has_been_modified boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.review_comments OWNER TO resonate_user;

--
-- Name: review_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.review_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_comments_id_seq OWNER TO resonate_user;

--
-- Name: review_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.review_comments_id_seq OWNED BY public.review_comments.id;


--
-- Name: review_likes; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.review_likes (
    user_id character varying NOT NULL,
    review_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_likes OWNER TO resonate_user;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    parent_id integer,
    user_id character varying NOT NULL,
    album_id uuid NOT NULL,
    rating integer,
    content text,
    has_been_modified boolean DEFAULT false NOT NULL,
    posted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 0) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO resonate_user;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO resonate_user;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: tracks; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.tracks (
    id uuid NOT NULL,
    album_id uuid NOT NULL,
    name character varying NOT NULL,
    artist character varying,
    "position" integer,
    duration integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tracks OWNER TO resonate_user;

--
-- Name: user_activity_feed; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.user_activity_feed (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    activity_type public.activitytypes NOT NULL,
    target_user_id character varying,
    review_id integer,
    playlist_id integer,
    album_id uuid,
    track_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_activity_feed OWNER TO resonate_user;

--
-- Name: user_activity_feed_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.user_activity_feed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_activity_feed_id_seq OWNER TO resonate_user;

--
-- Name: user_activity_feed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.user_activity_feed_id_seq OWNED BY public.user_activity_feed.id;


--
-- Name: user_album_status; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.user_album_status (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    album_id uuid NOT NULL,
    status public.mediastatus NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_album_status OWNER TO resonate_user;

--
-- Name: user_album_status_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.user_album_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_album_status_id_seq OWNER TO resonate_user;

--
-- Name: user_album_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.user_album_status_id_seq OWNED BY public.user_album_status.id;


--
-- Name: user_playlist_items; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.user_playlist_items (
    id integer NOT NULL,
    playlist_id integer NOT NULL,
    track_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_playlist_items OWNER TO resonate_user;

--
-- Name: user_playlist_items_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.user_playlist_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_playlist_items_id_seq OWNER TO resonate_user;

--
-- Name: user_playlist_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.user_playlist_items_id_seq OWNED BY public.user_playlist_items.id;


--
-- Name: user_playlist_status; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.user_playlist_status (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    playlist_id integer NOT NULL,
    status public.mediastatus NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_playlist_status OWNER TO resonate_user;

--
-- Name: user_playlist_status_id_seq; Type: SEQUENCE; Schema: public; Owner: resonate_user
--

CREATE SEQUENCE public.user_playlist_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_playlist_status_id_seq OWNER TO resonate_user;

--
-- Name: user_playlist_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: resonate_user
--

ALTER SEQUENCE public.user_playlist_status_id_seq OWNED BY public.user_playlist_status.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: resonate_user
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying,
    username character varying NOT NULL,
    role character varying NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name character varying,
    last_name character varying,
    birth_date date,
    avatar_url character varying,
    bio text,
    website character varying,
    theme character varying NOT NULL,
    language character varying NOT NULL,
    email_notifications boolean NOT NULL
);


ALTER TABLE public.users OWNER TO resonate_user;

--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: review_comments id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_comments ALTER COLUMN id SET DEFAULT nextval('public.review_comments_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: user_activity_feed id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed ALTER COLUMN id SET DEFAULT nextval('public.user_activity_feed_id_seq'::regclass);


--
-- Name: user_album_status id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_album_status ALTER COLUMN id SET DEFAULT nextval('public.user_album_status_id_seq'::regclass);


--
-- Name: user_playlist_items id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_items ALTER COLUMN id SET DEFAULT nextval('public.user_playlist_items_id_seq'::regclass);


--
-- Name: user_playlist_status id; Type: DEFAULT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_status ALTER COLUMN id SET DEFAULT nextval('public.user_playlist_status_id_seq'::regclass);


--
-- Name: album_search_cache album_search_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.album_search_cache
    ADD CONSTRAINT album_search_cache_pkey PRIMARY KEY (id);


--
-- Name: albums albums_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_pkey PRIMARY KEY (id);


--
-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (id);


--
-- Name: review_likes review_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_likes
    ADD CONSTRAINT review_likes_pkey PRIMARY KEY (user_id, review_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: tracks tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT tracks_pkey PRIMARY KEY (id);


--
-- Name: reviews unique review per person per album; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "unique review per person per album" UNIQUE (user_id, album_id);


--
-- Name: conversations unique_conversation_users; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT unique_conversation_users UNIQUE (user1_id, user2_id);


--
-- Name: user_album_status unique_status_per_user_per_album; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_album_status
    ADD CONSTRAINT unique_status_per_user_per_album UNIQUE (user_id, album_id);


--
-- Name: user_playlist_status unique_status_per_user_per_playlist; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_status
    ADD CONSTRAINT unique_status_per_user_per_playlist UNIQUE (user_id, playlist_id);


--
-- Name: user_playlist_items unique_track_per_playlist; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_items
    ADD CONSTRAINT unique_track_per_playlist UNIQUE (playlist_id, track_id);


--
-- Name: user_activity_feed user_activity_feed_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_pkey PRIMARY KEY (id);


--
-- Name: user_album_status user_album_status_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_album_status
    ADD CONSTRAINT user_album_status_pkey PRIMARY KEY (id);


--
-- Name: user_playlist_items user_playlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_items
    ADD CONSTRAINT user_playlist_items_pkey PRIMARY KEY (id);


--
-- Name: user_playlist_status user_playlist_status_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_status
    ADD CONSTRAINT user_playlist_status_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_album_search_cache_query; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_album_search_cache_query ON public.album_search_cache USING btree (query);


--
-- Name: ix_albums_lastfm_url; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_albums_lastfm_url ON public.albums USING btree (lastfm_url);


--
-- Name: ix_artists_lastfm_url; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_artists_lastfm_url ON public.artists USING btree (lastfm_url);


--
-- Name: ix_artists_name; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_artists_name ON public.artists USING btree (name);


--
-- Name: ix_conversations_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_conversations_id ON public.conversations USING btree (id);


--
-- Name: ix_messages_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_messages_id ON public.messages USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_playlists_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_playlists_id ON public.playlists USING btree (id);


--
-- Name: ix_refresh_tokens_token; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: ix_reports_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_reports_id ON public.reports USING btree (id);


--
-- Name: ix_review_comments_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_review_comments_id ON public.review_comments USING btree (id);


--
-- Name: ix_reviews_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_reviews_id ON public.reviews USING btree (id);


--
-- Name: ix_user_activity_feed_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_user_activity_feed_id ON public.user_activity_feed USING btree (id);


--
-- Name: ix_user_album_status_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_user_album_status_id ON public.user_album_status USING btree (id);


--
-- Name: ix_user_playlist_items_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_user_playlist_items_id ON public.user_playlist_items USING btree (id);


--
-- Name: ix_user_playlist_status_id; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE INDEX ix_user_playlist_status_id ON public.user_playlist_status USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: resonate_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: conversations conversations_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_review_id_fkey FOREIGN KEY (related_review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_accounts oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: playlists playlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reports reports_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: review_comments review_comments_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_likes review_likes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_likes
    ADD CONSTRAINT review_likes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: review_likes review_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.review_likes
    ADD CONSTRAINT review_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tracks tracks_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT tracks_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;


--
-- Name: user_activity_feed user_activity_feed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_activity_feed
    ADD CONSTRAINT user_activity_feed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_album_status user_album_status_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_album_status
    ADD CONSTRAINT user_album_status_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- Name: user_album_status user_album_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_album_status
    ADD CONSTRAINT user_album_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_playlist_items user_playlist_items_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_items
    ADD CONSTRAINT user_playlist_items_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: user_playlist_items user_playlist_items_track_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_items
    ADD CONSTRAINT user_playlist_items_track_id_fkey FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE;


--
-- Name: user_playlist_status user_playlist_status_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_status
    ADD CONSTRAINT user_playlist_status_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: user_playlist_status user_playlist_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: resonate_user
--

ALTER TABLE ONLY public.user_playlist_status
    ADD CONSTRAINT user_playlist_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict B6yE7QinzVBnz1cw3btPzfRtDf9voboTMImL1Edc3iCyCCqS9sDgod3dZW4LpNc

