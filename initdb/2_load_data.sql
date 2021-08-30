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
