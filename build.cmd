# NOTE! : Execute the following command once to enabled docker buildx to create multi-architecture images
# 
# docker buildx create --name docker-builder --use
#

npm install
docker buildx build --push --platform linux/arm/v7,linux/arm64/v8,linux/amd64 --tag namsource/qiktrak:latest .