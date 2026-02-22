#!/bin/bash
set -e

# 실행 권한 부여 필요 : sudo chmod -x init-db.sh
# mongodb init
mongosh <<EOF
use ${LTI_DB_NAME}
db.createUser({
  user: "${LTI_DB_USER}",
  pwd: "${LTI_DB_PASSWORD}",
  roles: [{ role: "readWrite", db: "${LTI_DB_NAME}" }]
})
EOF