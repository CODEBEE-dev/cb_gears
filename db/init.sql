CREATE TABLE IF NOT EXISTS worlds (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(36),
  name        VARCHAR(255) NOT NULL,
  options     JSONB NOT NULL DEFAULT '{}',
  thumbnail   TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS robots (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(36),
  name        VARCHAR(255) NOT NULL,
  options     JSONB NOT NULL DEFAULT '{}',
  thumbnail   TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  block_xml   TEXT,
  python      JSONB NOT NULL DEFAULT '{}',
  world_id    INT NOT NULL,
  robot_id    INT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (world_id) REFERENCES worlds(id),
  FOREIGN KEY (robot_id) REFERENCES robots(id)
);

-- 시퀀스 초기화 (기본값 INSERT 후 충돌 방지)
SELECT setval('worlds_id_seq', 1);
SELECT setval('robots_id_seq', 1);

-- 디폴트 월드 (Grid Map)
INSERT INTO worlds (id, user_id, name, options) VALUES (
  1,
  NULL,
  'Grid Map (20cm)',
  '{
    "imageURL": "textures/maps/grid.png",
    "imageScale": 2.353,
    "length": 400,
    "width": 400,
    "wallHeight": 10,
    "wallThickness": 5,
    "wallColor": "B3B3B3",
    "groundType": "box",
    "uScale": 19.27,
    "vScale": 20,
    "timer": "none",
    "timerDuration": 60,
    "timerEnd": "continue",
    "wall": true,
    "groundFriction": 1,
    "wallFriction": 0.1,
    "groundRestitution": 0.0,
    "wallRestitution": 0.1,
    "restartAnimationOnRun": false,
    "objects": [],
    "startPos": "center"
  }'
);

-- 디폴트 로봇 (Single Sensor Line Follower)
INSERT INTO robots (id, user_id, name, options) VALUES (
  1,
  NULL,
  'Single Sensor Line Follower',
  '{
    "name": "singleFollower",
    "bodyHeight": 4,
    "bodyWidth": 14,
    "bodyLength": 16,
    "wheels": true,
    "wheelDiameter": 5.6,
    "wheelWidth": 0.8,
    "wheelToBodyOffset": 0.2,
    "bodyEdgeToWheelCenterY": 1,
    "bodyEdgeToWheelCenterZ": 2,
    "bodyMass": 1000,
    "wheelMass": 200,
    "casterMass": 0,
    "caster": true,
    "wheelFriction": 10,
    "bodyFriction": 0,
    "casterFriction": 0,
    "color": "#F09C0D",
    "imageType": "all",
    "imageURL": "",
    "components": [
      {"type": "ColorSensor", "position": [0, -1, 9], "rotation": [1.5707963267948966, 0, 0], "options": null},
      {"type": "UltrasonicSensor", "position": [0, 2.5, 8], "rotation": [0, 0, 0], "options": null},
      {"type": "GyroSensor", "position": [0, 2.5, 2.5], "options": null},
      {"type": "GPSSensor", "position": [0, 2.5, 5], "options": null},
      {"type": "MagnetActuator", "position": [0, -1, 3], "rotation": [0, 0, 0], "options": null},
      {"type": "Pen", "position": [0, 0, 6], "rotation": [0, 0, 0], "options": null}
    ]
  }'
);
