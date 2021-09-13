    ---
    --- Warning!!!
    ---
    --- This script will delete all data and reset back to the initial test state
    ---

    DROP SCHEMA IF EXISTS membership CASCADE;
    CREATE SCHEMA membership;

    CREATE TABLE membership.status (
        name text PRIMARY KEY,
        comment text NOT NULL,
        
        createdAt timestamp without time zone DEFAULT now() NOT NULL,
        updatedAt timestamp without time zone
    );

    CREATE TABLE membership.roles (
        name text PRIMARY KEY,
        comment text NOT NULL,
        
        createdAt timestamp without time zone DEFAULT now() NOT NULL,
        updatedAt timestamp without time zone
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

----------------------------------------------------------------------------------------
-- TEST DATA
--
--
INSERT INTO membership.roles ("name", "comment")
VALUES 
    ('admin', 'Tenant administrator'),
    ('member', 'Member'),
    ('leader', 'Membership Manager');

INSERT INTO membership.status ("name", "comment")
VALUES 
    ('active', 'Membership active'),
    ('cancelled', 'Membership cancelled');

INSERT INTO membership.groups ("name", "state", "meeting_day", "group_news")
VALUES 
    (
        'Group 1',
        'WA',
        'Every Monday',
        'Please remember to keep your password safe'
    ),
    (
        'Group 2',
        'NSW',
        'Every Thursday',
        'Sheila is preseting on Friday evening at the Town Hall'
    );

INSERT INTO membership.members ("group_id","firstname","lastname","company","email","mobile","status_id","role_id")
VALUES
('1','Jack',  'Valley', 'Megacorp',       'am@madeupemail.com.au','0400 111 222','active','leader'),
('1','Jill',  'Hill',   'StartsUp',       'bm@madeupemail.com.au','0400 211 222','active','member'),
('1','Barry', 'Clyde',  'Fast cars Inc',  'cm@madeupemail.com.au','0400 311 222','active','member'),
('2','Sheila','jones',  'Rest-a-while',   'dm@madeupemail.com.au','0400 411 222','active','leader'),
('2','Angela','Smith',  'Angies Plumbers','em@madeupemail.com.au','0400 511 222','active','member'),
('2','Ben',   'Masters','Finance Wizards','fm@madeupemail.com.au','0400 611 222','active','admin');

UPDATE membership.groups SET leader_id=1 WHERE group_id = 1;
UPDATE membership.groups SET leader_id=4 WHERE group_id = 2;


---
--- IOT sample data
---

INSERT INTO membership.iot_device_types
("name", "comment")
VALUES
('SMW', 'Smart Watch'),
('ENV', 'Environmental Monitor')
;

INSERT INTO membership.iot_devices
("member_id","device_type_id", "description")
VALUES
(1, 'SMW', 'Jack''s smart watch'),
(1, 'ENV', 'Jack''s Environmental Monitor')
;

INSERT INTO membership.iot_messages
("device_id", "json_data")
VALUES
(1, '{ "temp": 25.1, "heart_rate": 80, "steps": 250, "oxygen": 100 }'),
(1, '{ "temp": 26.8, "heart_rate": 120, "steps": 200, "oxygen": 96 }'),
(1, '{ "temp": 27.3, "heart_rate": 110, "steps": 100, "oxygen": 97 }'),
(1, '{ "temp": 28.5, "heart_rate": 90, "steps": 50, "oxygen": 96 }'),
(1, '{ "temp": 31.2, "heart_rate": 80, "steps": 20, "oxygen": 100 }'),
(2, '{ "temp": 28, "humidity": 60, "dust": 200 }'),
(2, '{ "temp": 30, "humidity": 50, "dust": 200 }'),
(2, '{ "temp": 29.5, "humidity": 55, "dust": 200 }'),
(2, '{ "temp": 27.5, "humidity": 68, "dust": 200 }')
;