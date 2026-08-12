#!/bin/bash
# Node setup for OpenShip builds on Unraid
set -e
LOG=/tmp/node-setup.log
exec >$LOG 2>&1
echo "=== SETUP $(date) ==="

# Find runtime in OpenShip
if [ -d /opt/openship/.runtime ]; then
  echo "Runtime dir exists"
  ls /opt/openship/.runtime/
  RUNTIME=$(ls /opt/openship/.runtime/ | head -1)
  RUNTIME_PATH="/opt/openship/.runtime/$RUNTIME"
  if [ -d "$RUNTIME_PATH/bin" ]; then
    cp -a "$RUNTIME_PATH/"* /usr/local/
    echo "Copied from $RUNTIME_PATH"
  fi
fi

# Fallback download
if [ ! -f /usr/local/bin/node ]; then
  echo "Downloading node..."
  curl -fsSL --connect-timeout 10 --max-time 120 -o /tmp/node.tar.xz https://nodejs.org/dist/v22.13.0/node-v22.13.0-linux-x64.tar.xz
  ls -la /tmp/node.tar.xz
  cd /usr/local && tar -xJf /tmp/node.tar.xz --strip-components=1
  rm /tmp/node.tar.xz
fi

ln -sf /usr/local/bin/node /usr/bin/node 2>/dev/null || true
ln -sf /usr/local/bin/npm /usr/bin/npm 2>/dev/null || true

NODE_VER=$(/usr/local/bin/node -v 2>&1 || echo NO_NODE)
echo "NODE=$NODE_VER"

# persistence
mkdir -p /boot/config/plugins/node
cat > /boot/config/plugins/node/install.sh << 'PERS'
#!/bin/bash
if [ ! -f /usr/local/bin/node ]; then
  if [ -d /opt/openship/.runtime ]; then
    RDIR=$(ls /opt/openship/.runtime/ | head -1)
    cp -a /opt/openship/.runtime/"$RDIR"/ /usr/local/ 2>/dev/null || true
  fi
  if [ ! -f /usr/local/bin/node ]; then
    curl -fsSL -o /tmp/node.tar.xz https://nodejs.org/dist/v22.13.0/node-v22.13.0-linux-x64.tar.xz
    cd /usr/local && tar -xJf /tmp/node.tar.xz --strip-components=1 && rm /tmp/node.tar.xz
  fi
  ln -sf /usr/local/bin/node /usr/bin/node
  ln -sf /usr/local/bin/npm /usr/bin/npm
fi
PERS
chmod +x /boot/config/plugins/node/install.sh
grep -q plugins/node/install.sh /boot/config/go || echo /boot/config/plugins/node/install.sh >> /boot/config/go

# start app
fuser -k 5173/tcp 2>/dev/null || true
sleep 1
cd /opt/openship/.builds
BDIR=$(find . -maxdepth 2 -name server.cjs 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
if [ -n "$BDIR" ]; then
  cd "$BDIR"
  nohup /usr/local/bin/node server.cjs > /tmp/app-output.log 2>&1 &
  echo "App started PID=$! at $BDIR"
else
  echo "No server.cjs found"
  find /opt/openship -name server.cjs 2>/dev/null | head -5
fi
echo "=== DONE ==="