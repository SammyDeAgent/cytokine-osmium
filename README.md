# Cytokine Osmium
University Final Year Project - Web App

A web app which allows players/users to create a account for joining up a team,
participate in custom lobby or tournament and also involve in global rating system
on player behaviour and compliments.

Web server: https://cytokine-osmium.xyz (Dead URL)

# Nginx Config
```
server {	
	listen 443 default_server ssl;
	listen [::]:443 default_server ssl;
	
	ssl_certificate 	/etc/letsencrypt/live/[your-site]/fullchain.pem;
	ssl_certificate_key	/etc/letsencrypt/live/[your-site]/privkey.pem;
	
	root [your-site];
	index index.html index.htm index.nginx-debian.html;

	server_name [site-name];
	
	include snippets/custom-error-page.conf;

	# Only allow these request methods
      	if ($request_method !~ ^(GET|HEAD|POST)$ ) {
        	return 444;
      	}	

	location / {
		proxy_http_version 1.1;
		proxy_cache_bypass $http_upgrade;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_pass http://localhost:4200;
	}
}

server {	
	server_name [your-site];
	return 301 [your-site]$request_uri;
}
```

# Pre-requisite Database
```
-- Table Prototypes
CREATE TABLE IF NOT EXISTS accounts (
    id              VARCHAR(255)    NOT NULL,
    username        VARCHAR(255)    NOT NULL,
    sitename        VARCHAR(255)    NOT NULL,
    pimage          VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    register_stamp  DATE            NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT un_uname UNIQUE (username),
    CONSTRAINT un_email UNIQUE (email)
);

-- when first register, verify_code will be randomly generated, when confirmed, it will become NULL
-- verify_status: 'PENDING', 'VERIFIED'
CREATE TABLE IF NOT EXISTS account_verify (
  id                VARCHAR(255)    NOT NULL,
  verify_status     VARCHAR(255)    NOT NULL,
  verify_code       VARCHAR(255),
  FOREIGN KEY (id)              REFERENCES accounts (id)        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account_status (
    id              VARCHAR(255)    NOT NULL,
    status_text     TEXT            NOT NULL,
    FOREIGN KEY (id)            REFERENCES accounts (id)        ON DELETE CASCADE
);

-- site_privilege: 'DEV', 'ADMIN', 'MOD', 'VIP', 'USER'
CREATE TABLE IF NOT EXISTS account_special (
    id              VARCHAR(255)    NOT NULL,
    site_privilege  VARCHAR(50)     NOT NULL,
    FOREIGN KEY (id)            REFERENCES accounts (id)        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
    team_code       VARCHAR(8)      NOT NULL,
    team_name       VARCHAR(255)    NOT NULL,
    team_desc       TEXT            NOT NULL,
    team_pimage     VARCHAR(255)    NOT NULL,
    team_leader     VARCHAR(255)    NOT NULL,
    team_cTime      DATE            NOT NULL,
    team_invCode    VARCHAR(6)      NOT NULL,
    PRIMARY KEY (team_code),
    FOREIGN KEY (team_leader)   REFERENCES accounts (id)        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_comp (
    team_code       VARCHAR(8)      NOT NULL,
    team_member     VARCHAR(255)    NOT NULL,
    FOREIGN KEY (team_code)     REFERENCES teams (team_code)    ON DELETE CASCADE,
    FOREIGN KEY (team_member)   REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Default account rating at 1000
-- Each compliment increases rating by 10
-- Each disapprove decreases rating by 10
-- Participation increases rating by 1
-- Finalist icreaese rating by 20
-- Special rating events may apply
CREATE TABLE IF NOT EXISTS account_compliments (
    id              VARCHAR(255)    NOT NULL,
    compliment      INT             NOT NULL,
    disapprove      INT             NOT NULL, 
    lobby_complete  INT             NOT NULL,
    tourn_complete  INT             NOT NULL,
    tourn_finalist  INT             NOT NULL,
    special_rating  INT             NOT NULL,
    FOREIGN KEY (id)            REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Checks if if a player has already been voted for a id
CREATE TABLE IF NOT EXISTS account_voted (
    id              VARCHAR(255)    NOT NULL,
    voted_id        VARCHAR(255)    NOT NULL,
    vote_desc       VARCHAR(255)    NOT NULL,
    FOREIGN KEY (id)            REFERENCES accounts (id)        ON DELETE CASCADE,
    FOREIGN KEY (voted_id)      REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Lobby Details
-- open: 1(public), 0(private)
-- status: WAITING, ON-GOING, ENDED
-- game: TF2, Brawhalla
-- type: PUG-TEAM, PUG-1v1
-- region: refer to the form
-- skill: (optional) Game Respective Code
CREATE TABLE IF NOT EXISTS lobbies (
    lobby_code      VARCHAR(8)      NOT NULL,
    lobby_name      VARCHAR(255)    NOT NULL,
    lobby_desc      VARCHAR(255)    NOT NULL,
    lobby_leader    VARCHAR(255)    NOT NULL,
    lobby_cTime     DATE            NOT NULL,
    lobby_open      INT             NOT NULL,
    lobby_region    VARCHAR(255)    NOT NULL,
    lobby_pass      VARCHAR(6)      ,
    lobby_status    VARCHAR(255)    NOT NULL,
    lobby_game      VARCHAR(255)    NOT NULL,
    lobby_type      VARCHAR(255)    NOT NULL,
    lobby_skill     VARCHAR(255)    NOT NULL,
    PRIMARY KEY (lobby_code),
    FOREIGN KEY (lobby_leader)   REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Lobby Teams
-- team: 1 or 2
CREATE TABLE IF NOT EXISTS lobbies_team (
    lobby_code      VARCHAR(8)      NOT NULL,
    id              VARCHAR(255)    NOT NULL,
    team            INT             NOT NULL,
    FOREIGN KEY (lobby_code)     REFERENCES lobbies (lobby_code) ON DELETE CASCADE,
    FOREIGN KEY (id)             REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Tournament
CREATE TABLE IF NOT EXISTS tournaments (
    tournament_code   VARCHAR(8)      NOT NULL,
    tournament_name   VARCHAR(255)    NOT NULL,
    tournament_desc   VARCHAR(255)    NOT NULL,
    tournament_cTime  DATE            NOT NULL,
    tournament_status VARCHAR(255)    NOT NULL,
    tournament_game   VARCHAR(255)    NOT NULL,
    tournament_type   VARCHAR(255)    NOT NULL,
    tournament_skill  VARCHAR(255)    NOT NULL,
    tournament_region VARCHAR(255)    NOT NULL,
    tournament_open   INT             NOT NULL,
    tournament_pass   VARCHAR(6)      ,
    tournament_leader VARCHAR(255)    NOT NULL,
    max_climb         INT             ,
    max_bracket       INT             ,
    PRIMARY KEY (tournament_code),
    FOREIGN KEY (tournament_leader) REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Tournament Tree
-- The size of the tree is dependant of the user amount
-- Before starting, all the tree details of user are NULL
-- Attribute climb: In which level a player has climbed on the tree, where 0 being the 1st place
-- Attribute bracket: In which bracket a player is, where the max number of a bracket depends on the user amount
CREATE TABLE IF NOT EXISTS tournaments_tree (
    tournament_code   VARCHAR(8)      NOT NULL,
    id                VARCHAR(255)    NOT NULL,
    climb             INT             ,
    bracket           INT             ,
    matchpoint        INT             DEFAULT 0,
    FOREIGN KEY (tournament_code) REFERENCES tournaments (tournament_code) ON DELETE CASCADE,
    FOREIGN KEY (id)             REFERENCES accounts (id)        ON DELETE CASCADE
);

-- Tournament Tree Match Details
-- Match status: 'PENDING', 'ON-GOING', 'CONCLUDED'
CREATE TABLE IF NOT EXISTS tournaments_match (
    tournament_code   VARCHAR(8)      NOT NULL,
    climb             INT             NOT NULL,
    bracket           INT             NOT NULL,
    id_1              VARCHAR(255)    NOT NULL,
    id_2              VARCHAR(255)    NOT NULL,
    point_1           INT             NOT NULL,
    point_2           INT             NOT NULL,
    match_status      VARCHAR(255)    NOT NULL,
    FOREIGN KEY (tournament_code)  REFERENCES tournaments (tournament_code) ON DELETE CASCADE,
    FOREIGN KEY (id_1)             REFERENCES accounts (id)        ON DELETE CASCADE,
    FOREIGN KEY (id_2)             REFERENCES accounts (id)        ON DELETE CASCADE
);
```

