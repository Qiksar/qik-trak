# Ref: https://docs.docker.com/desktop/multi-arch/
#
# Execute the following command once to enabled docker buildx to create multi-arch images
# docker buildx create --name docker-builder --use

docker buildx build --push --platform linux/arm/v7,linux/arm64/v8,linux/amd64 --tag namsource/qiktrak:latest .