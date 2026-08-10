#!/bin/bash
set -e

echo "Installing git-lfs..."
apt-get update && apt-get install -y git-lfs

echo "Pulling LFS files..."
git lfs pull

echo "Build complete - all LFS files ready"
