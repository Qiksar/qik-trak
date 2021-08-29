# qik-trak

Super fast and oppinionated setup for Hasura table and relationship tracking.

In one line, qik-trak applies intuitive names to your tables and relationships, and provides a no-touch setup process for automated tracking settings. In other words, you don't have to use the Hasura Console to track your database and modify relationships names, which can be very abstract when they are set to the defaults used by Hasura.

Skip to the end to see sample output, this might give you an instant idea of what the tool does.

## What you need to get started

All you need is (most likely already have) is a postgres database with Hasura. 

**WARNING**: This tool will remove all of the current tracking data (if any exists) and will then implement tracking with names that closely match the naming convention of your database.

Next, read through this brief guide on why the tool exists, what it does and how to run it.

## The problem we're trying to solve

Personally, when I build and test systems I like to have a quick means of creating a database, loading data, setting up Hasura and running queries. Because data
get changed as tests are executed, I want to repeat this loop, so I can destroy the database (i.e. Docker container holding the DB), and create a completely
new database, where I know the starting state of all data.

You may think this is extreme, or unnecessary and it might actually only be suitable for rapid prototypes, and I'm open to all such oppinions.

But this is a real problem for me, and in other contexts, people solve this with in-memory databases and seed data. But I wanted to go a step further
and have a real database, with real GraphQL etc.

**Thought**: It may be the case that this 'solution' only really suits simple databases and particular stages of development, like rapid prototyping. 

## Oppinionated?

Yes, I don't like the names that Hasura gives to tables, pre-pending schema names, and I don't like the way relationships are named. That my oppinion.

This is the single reason I originally created Hasura Auto Tracker. But these days I found I need something really simple, driven by environment variables
not command line arguments, and something that I can run from the CLI if I am working on this project, or burn into a Docker container, and then just execute
through the docker command line.

The end result is that rather than having a GraphQL object called *customer_database_customers*, you will get just *customers*. More concise, and exactly as it's named in your schema.

## So what does it actually do?

if you're familiar with Hasura, you know the Admin Console enables you to connect to a database and track (connect graphql to database entities) through the Data tab.

Once a database is connected with Hasura, there will be a simple list of tables with Hasura's preferred names, and once these are "tracked" you will be offered a list
of foreign keys, again with Hasura's preferred naming for graph relationships.

So, its implicit here, that in order to track a database, tables and relationships, you have to run manual steps. That's not good for an automated build process, which setting up a local dev or test environment typically uses.

So putting it simple, qik-track sets up the Hasura tracking with concise and intuitive names, which applied to tables and relationships.

## Ok, how do we run it?

You can pull the code, edit the sample env file and input your own settings and save as .env then just run 

```
npm install
npm run

or:

node cli.js

or

docker-compose up -d 
This will build the tracker tool in a docker container, so you can quickly pull the container from your own registry and run it with no more setup, other than building and using an environment file.

```

## This is brilliant!!

Perhaps, but it can also be dangerous. Although the tool does use the Hasura API to setup the metadata, it remains to be seen whether it plays nicely with metadata other than tracking information. For example, when untracking, we will loose permissions. So there is more work to be done to understand use cases. Therefore, there are some todo items listed below.

# TODO

As this is a very new project, a simplification of previous work, and connected with the fact that I don't currently use the Hasura CLI, I'm conscious of some further work that needs to be done, most of which needs to be validated and oppinions, advice and comments are most welcome.

## Untracking tables will destroy permissions - what can be done about this?
The tracker should have a way to implement permissions, but this is duplicating the work of the Hasura CLI. But an alternative approach may be welcomed in the community.

Perhaps a YAML description of the database could help with creating and seeding the database (with autogenerated test data), then further aspects of the YAML could describe the required permissions.

## CRUD APIs
Based on acceptance of an oppinionated system, it may be valuable to generate REST endpoints that provide basic CRUD functions. This helps to reduce the amount of data handling code in the app, and refactors queries out of code, where they can be more easily edited through the Hasura console.


# Sample Output

I have a postgres database which I build and seed from a SQL script. The next step is to run the cli, as indicated below.

Moments later, my Hasura tracking is all setup.

Key point: This is a very simple membership database, and now my *members* table is called just that, not *membership_members*.
```

> qik-track@2.3.1 start_cli C:\dev\qik-trak
> node cli.js

--------------------------------------------------------------

        qik-track          : Rapid, intuitive Hasura tracking setup

        DATABASE           : 'members'
        SCHEMA             : 'membership'
        HASURA ENDPOINT    : 'http://localhost:8092'
        PRIMARY KEY SUFFIX : '_id'

--------------------------------------------------------------     

REMOVE PREVIOUS HASURA TRACKING DETAILS FOR TABLES AND VIEWS
    UNTRACK TABLE      - chat_channels 
    UNTRACK TABLE      - member_role   
    UNTRACK TABLE      - member_status 
    UNTRACK TABLE      - members       
    UNTRACK TABLE      - messages      
    UNTRACK TABLE      - syndicate_chat
    UNTRACK TABLE      - syndicates    

CONFIGURE HASURA TABLE/VIEW TRACKING  
    TRACK TABLE        - chat_channels
    TRACK TABLE        - member_role
    TRACK TABLE        - member_status
    TRACK TABLE        - members
    TRACK TABLE        - messages
    TRACK TABLE        - syndicate_chat
    TRACK TABLE        - syndicates

CONFIGURE HASURA RELATIONSHIP TRACKING
    ARRAY RELATIONSHIP - syndicate_members : Lookup all members where syndicate matches syndicates
    ARRAY RELATIONSHIP - member_role_members : Lookup all members where member_role matches member_role
    ARRAY RELATIONSHIP - member_status_members : Lookup all members where member_status matches member_status
    ARRAY RELATIONSHIP - chair_syndicates : Lookup all syndicates where chair matches members
    ARRAY RELATIONSHIP - to_member_messages : Lookup all messages where to_member_id matches members
    ARRAY RELATIONSHIP - from_member_messages : Lookup all messages where from_member_id matches members
    ARRAY RELATIONSHIP - sender_syndicate_chat : Lookup all syndicate_chat where sender_id matches members
    ARRAY RELATIONSHIP - syndicate_syndicate_chat : Lookup all syndicate_chat where syndicate_id matches syndicates        
    ARRAY RELATIONSHIP - to_member_chat_channels : Lookup all chat_channels where to_member_id matches members
    ARRAY RELATIONSHIP - from_member_chat_channels : Lookup all chat_channels where from_member_id matches members

   OBJECT RELATIONSHIP - syndicate_chat referencing members using sender_id
   OBJECT RELATIONSHIP - members referencing syndicates using syndicate
   OBJECT RELATIONSHIP - members referencing member_status using member_status
   OBJECT RELATIONSHIP - syndicates referencing members using chair                         <<<< Here is a good example. This column would be called member, now it's called **chair** which is the function of the column, i.e. who is the chair person of the syndicate, which has many members. So calling this column member, would be dumb! :)
   OBJECT RELATIONSHIP - messages referencing members using from_member_id
   OBJECT RELATIONSHIP - messages referencing members using to_member_id
   OBJECT RELATIONSHIP - members referencing member_role using member_role
   OBJECT RELATIONSHIP - syndicate_chat referencing syndicates using syndicate_id
   OBJECT RELATIONSHIP - chat_channels referencing members using from_member_id
   OBJECT RELATIONSHIP - chat_channels referencing members using to_member_id
```