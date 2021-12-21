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
('1','Jack',  'Valley', 'Megacorp',       'am@madeupemail.com.au','0400 111 222','1','2'),
('1','Jill',  'Hill',   'StartsUp',       'bm@madeupemail.com.au','0400 211 222','1','2'),
('1','Barry', 'Clyde',  'Fast cars Inc',  'cm@madeupemail.com.au','0400 311 222','1','2'),
('2','Sheila','jones',  'Rest-a-while',   'dm@madeupemail.com.au','0400 411 222','1','2'),
('2','Angela','Smith',  'Angies Plumbers','em@madeupemail.com.au','0400 511 222','1','2'),
('2','Ben',   'Masters','Finance Wizards','fm@madeupemail.com.au','0400 611 222','1','2');

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