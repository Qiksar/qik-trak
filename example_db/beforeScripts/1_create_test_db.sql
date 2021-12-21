    ---
    --- Warning!!!
    ---
    --- This script will delete all data and reset back to the initial test state
    ---

    DROP SCHEMA IF EXISTS membership CASCADE;
    CREATE SCHEMA membership;

    CREATE TABLE membership.status (
        status_id SERIAL PRIMARY KEY,
        name text NOT NULL UNIQUE,
        comment text NOT NULL
    );

    CREATE TABLE membership.roles (
        role_id SERIAL PRIMARY KEY,
        name text NOT NULL UNIQUE,
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
        status_id integer NOT NULL REFERENCES membership.status,
        role_id integer NOT NULL REFERENCES membership.roles,
        group_id integer NULL REFERENCES membership.groups,
        about_me text NULL,
        company text NULL,
        photo text NULL default 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OCI+PHBhdGggZD0iTTI0IDhjLTQuNDIgMC04IDMuNTgtOCA4IDAgNC40MSAzLjU4IDggOCA4czgtMy41OSA4LThjMC00LjQyLTMuNTgtOC04LTh6bTAgMjBjLTUuMzMgMC0xNiAyLjY3LTE2IDh2NGgzMnYtNGMwLTUuMzMtMTAuNjctOC0xNi04eiIvPjxwYXRoIGQ9Ik0wIDBoNDh2NDhoLTQ4eiIgZmlsbD0ibm9uZSIvPgoJCgkKCTxtZXRhZGF0YT4KCQk8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnJkZnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDEvcmRmLXNjaGVtYSMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+CgkJCTxyZGY6RGVzY3JpcHRpb24gYWJvdXQ9Imh0dHBzOi8vaWNvbnNjb3V0LmNvbS9sZWdhbCNsaWNlbnNlcyIgZGM6dGl0bGU9IkFjY291bnQsIEF2YXRhciwgUHJvZmlsZSwgSHVtYW4sIE1hbiwgVXNlciIgZGM6ZGVzY3JpcHRpb249IkFjY291bnQsIEF2YXRhciwgUHJvZmlsZSwgSHVtYW4sIE1hbiwgVXNlciIgZGM6cHVibGlzaGVyPSJJY29uc2NvdXQiIGRjOmRhdGU9IjIwMTYtMTItMTQiIGRjOmZvcm1hdD0iaW1hZ2Uvc3ZnK3htbCIgZGM6bGFuZ3VhZ2U9ImVuIj4KCQkJCTxkYzpjcmVhdG9yPgoJCQkJCTxyZGY6QmFnPgoJCQkJCQk8cmRmOmxpPkdvb2dsZSBJbmMuPC9yZGY6bGk+CgkJCQkJPC9yZGY6QmFnPgoJCQkJPC9kYzpjcmVhdG9yPgoJCQk8L3JkZjpEZXNjcmlwdGlvbj4KCQk8L3JkZjpSREY+CiAgICA8L21ldGFkYXRhPjwvc3ZnPgo=',
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone
    );

    ALTER TABLE membership.groups ADD CONSTRAINT group_leader FOREIGN KEY (leader_id) REFERENCES membership.members (member_id);


    ---
    --- IOT sample data
    ---

    CREATE TABLE membership.iot_device_types (
        name text PRIMARY KEY,
        comment text NOT NULL,

        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone
    );


    CREATE TABLE membership.iot_devices (
        device_id SERIAL PRIMARY KEY,
        device_type_id text REFERENCES membership.iot_device_types,
        member_id integer REFERENCES membership.members,
        description text NOT NULL,
        
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone
    );

    CREATE TABLE membership.iot_messages (
        message_id SERIAL PRIMARY KEY,
        device_id integer REFERENCES membership.iot_devices,
        json_data JSONB NOT NULL,

        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone
    );
