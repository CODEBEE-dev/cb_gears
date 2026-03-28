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
  id             SERIAL PRIMARY KEY,
  user_id        VARCHAR(36) NOT NULL,
  name           VARCHAR(255) NOT NULL,
  block_xml      TEXT,
  python         JSONB NOT NULL DEFAULT '{}',
  world_options  JSONB NOT NULL DEFAULT '{"imageURL":"textures/maps/grid.png","imageScale":2.353,"length":400,"width":400,"wallHeight":10,"wallThickness":5,"wallColor":"B3B3B3","groundType":"box","uScale":19.27,"vScale":20,"timer":"none","timerDuration":60,"timerEnd":"continue","wall":true,"groundFriction":1,"wallFriction":0.1,"groundRestitution":0.0,"wallRestitution":0.1,"restartAnimationOnRun":false,"objects":[],"startPos":"center"}',
  robot_options  JSONB NOT NULL DEFAULT '{"name":"singleFollower","bodyHeight":4,"bodyWidth":14,"bodyLength":16,"wheels":true,"wheelDiameter":5.6,"wheelWidth":0.8,"wheelToBodyOffset":0.2,"bodyEdgeToWheelCenterY":1,"bodyEdgeToWheelCenterZ":2,"bodyMass":1000,"wheelMass":200,"casterMass":0,"caster":true,"wheelFriction":10,"bodyFriction":0,"casterFriction":0,"color":"#F09C0D","imageType":"all","imageURL":"","components":[{"type":"ColorSensor","position":[0,-1,9],"rotation":[1.5707963267948966,0,0],"options":null},{"type":"UltrasonicSensor","position":[0,2.5,8],"rotation":[0,0,0],"options":null},{"type":"GyroSensor","position":[0,2.5,2.5],"options":null},{"type":"GPSSensor","position":[0,2.5,5],"options":null},{"type":"MagnetActuator","position":[0,-1,3],"rotation":[0,0,0],"options":null},{"type":"Pen","position":[0,0,6],"rotation":[0,0,0],"options":null}]}',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
