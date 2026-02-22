# LTI Backend
Moodle 과 Gears 연동을 위한 LTI 백엔드

<br />

## Requirements
1. 환경변수 작성
    ```bash
    cd lti-backend

    cp .env.example .env
    ```

2. 의존성 설치
    ```bash
    cd lti-backend
    npm i
    ```

3. MongoDB 설치  
    직접 설치하거나 `lti-backend/docker-compose.yml` 이용
    ```bash
    docker compose up -d

    # 로그 확인
    docker logs -f cb-mongo
    ```

<br />

## 서버 실행
```bash
node index.js
```
