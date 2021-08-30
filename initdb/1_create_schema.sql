---
--- Warning!!!
---
--- This script will delete all data and reset back to the initial test state
---

DROP SCHEMA IF EXISTS membership CASCADE;
CREATE SCHEMA membership;

CREATE TABLE membership.status (
    name text PRIMARY KEY,
    comment text NOT NULL
);

CREATE TABLE membership.roles (
    name text PRIMARY KEY,
    comment text NOT NULL
);

CREATE TABLE membership.groups (
    group_id SERIAL PRIMARY KEY,
    leader_id integer NULL,
    state text NOT NULL,
    name text NOT NULL,
    meeting_day text NOT NULL,
    group_news text NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);

CREATE TABLE membership.members (
    member_id SERIAL PRIMARY KEY,
    email text NOT NULL UNIQUE,
    mobile text NOT NULL UNIQUE,
    firstname text NOT NULL,
    lastname text NOT NULL,
    status_id text NOT NULL REFERENCES membership.status,
    role_id text NOT NULL REFERENCES membership.roles,
    group_id integer NULL REFERENCES membership.groups,
    about_me text NULL,
    company text NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);

ALTER TABLE membership.groups
ADD CONSTRAINT group_leader FOREIGN KEY (leader_id) REFERENCES membership.members (member_id);
