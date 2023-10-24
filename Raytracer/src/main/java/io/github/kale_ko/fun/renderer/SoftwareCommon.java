package io.github.kale_ko.fun.renderer;

import java.awt.Color;
import java.security.InvalidParameterException;

public abstract class SoftwareCommon {
    protected int levelWidth;
    protected int levelHeight;
    protected int[] level;

    protected double playerX;
    protected double playerY;
    protected double playerYaw = 0;

    protected final long fpsCap;
    protected final long fpsDelay;

    protected final int displayScale;

    protected final int playWidth;
    protected final int playHeight;
    protected final int playScale;

    protected final float playFov;

    protected boolean running = false;
    protected Thread renderThread;

    protected SoftwareCommon(int levelWidth, int levelHeight, int[] level, long fpsCap, int displayScale, int playWidth, int playHeight, int playScale, float playFov) {
        if (levelWidth <= 0 || levelHeight <= 0) {
            throw new InvalidParameterException("levelWidth and levelHeight must be > 0");
        }
        if (level.length != levelWidth * levelHeight) {
            throw new InvalidParameterException("level does not match levelWidth and levelHeight");
        }
        if (fpsCap <= 0) {
            throw new InvalidParameterException("fpsCap must be > 0");
        }
        if (displayScale <= 0) {
            throw new InvalidParameterException("displayScale must be > 0");
        }
        if (playWidth <= 0 || playHeight <= 0) {
            throw new InvalidParameterException("playWidth and playHeight must be > 0");
        }
        if (playScale <= 0) {
            throw new InvalidParameterException("playScale must be > 0");
        }
        if (playFov <= 0 || playFov >= 180) {
            throw new InvalidParameterException("playFov must be > 0 and < 180");
        }

        this.levelWidth = levelWidth;
        this.levelHeight = levelHeight;
        this.level = level;

        this.playerX = this.levelWidth / 2d;
        this.playerY = this.levelHeight / 2d;

        this.fpsCap = fpsCap;
        this.fpsDelay = 1000000000L / fpsCap;

        this.displayScale = displayScale;

        this.playWidth = playWidth;
        this.playHeight = playHeight;
        this.playScale = playScale;

        this.playFov = playFov;
    }

    public void run() {
        this.running = true;

        this.renderThread = new Thread(() -> {
            this.setup();

            long lastRender = System.nanoTime();
            long lastPrint = System.nanoTime();
            int fps = 0;

            while (this.running) {
                long time = System.nanoTime();

                if (time - lastRender > this.fpsDelay) {
                    long delta = time - lastRender;
                    double deltaSec = delta / 1000000000d;
                    lastRender = time;

                    this.render(deltaSec);

                    fps++;
                    if (time - lastPrint > 1000000000L) {
                        this.setTitle(this.getTitle().replace("{fps}", fps + ""));

                        lastPrint = time;
                        fps = 0;
                    }
                }
            }

            this.destroy();
        }, "Renderer/" + this.getClass().getSimpleName());
        this.renderThread.start();
    }

    public void stop() {
        this.running = false;
    }

    protected abstract void setup();

    protected abstract void destroy();

    protected abstract void render(double delta);

    protected void renderDisplay(double delta) {
        for (int i = 0; i < this.levelWidth * this.levelHeight; i++) {
            int x = i % this.levelWidth;
            int y = i / this.levelWidth;

            if (this.level[i] == 0) {
                drawSquare((x * this.displayScale) + 1, (y * this.displayScale) + 1, this.displayScale - 2, this.displayScale - 2, 0x000000);
            } else if (this.level[i] == 1) {
                drawSquare((x * this.displayScale) + 1, (y * this.displayScale) + 1, this.displayScale - 2, this.displayScale - 2, 0xFFFFFF);
            }
        }

        drawPoint(this.playerX * this.displayScale, this.playerY * this.displayScale, this.displayScale / 2f, 0xFFAA00);
        drawLine(this.playerX * this.displayScale, this.playerY * this.displayScale, (this.playerX * this.displayScale) + (Math.sin(this.playerYaw) * (this.displayScale / 2d)), (this.playerY * this.displayScale) + (Math.cos(this.playerYaw) * (this.displayScale / 2d)), this.displayScale / 4f, 0xFFAA00);

        for (int x = 0; x < this.playWidth; x++) {
            double direction = this.playerYaw - (this.playFov / 2) + (x * (this.playFov / this.playWidth));
            RayResult result = this.raycast(this.playerX, this.playerY, direction);

            drawLine(this.playerX * this.displayScale, this.playerY * this.displayScale, (this.playerX * this.displayScale) + (Math.sin(direction) * result.distance() * this.displayScale), (this.playerY * this.displayScale) + (Math.cos(direction) * result.distance() * this.displayScale), 1, 0xDD0000);
        }
    }

    protected void renderPlay(double delta) {
        int xOffset = this.levelWidth * this.displayScale;

        for (int x = 0; x < this.playWidth; x++) {
            double direction = this.playerYaw - (this.playFov / 2) + (x * (this.playFov / this.playWidth));
            RayResult result = this.raycast(this.playerX, this.playerY, direction);

            double fixedDistance = result.distance() * Math.cos(this.playerYaw - direction);
            double height = this.playHeight / fixedDistance;
            double yOffset = (this.playHeight / 2d) - (height / 2);

            drawLine(xOffset + ((this.playWidth - x) * this.playScale), yOffset * this.playScale, xOffset + ((this.playWidth - x) * this.playScale), (height + yOffset) * this.playScale, this.playScale, result.color().getRGB());
        }
    }

    protected record RayResult(double distance, Color color) {
    }

    protected RayResult raycast(double startX, double startY, double direction) {
        double ra = -direction + (Math.PI / 2);
        while (ra > Math.PI * 2) {
            ra -= Math.PI * 2;
        }
        while (ra < 0) {
            ra += Math.PI * 2;
        }

        double hitDistance = Double.POSITIVE_INFINITY;
        Color hitColor = new Color(0x000000);

        { // Vertical lines
            double rx = startX;
            double ry = startY;
            double xo = 0;
            double yo = 0;

            int depth = 0;
            double aTan = -1 / Math.tan(ra);

            if (ra > Math.PI) {
                ry = Math.floor(startY) - 0.001;
                rx = (startY - ry) * aTan + startX;
                yo = -1;
                xo = -yo * aTan;
            }
            if (ra < Math.PI) {
                ry = Math.floor(startY) + 1;
                rx = (startY - ry) * aTan + startX;
                yo = 1;
                xo = -yo * aTan;
            }
            if (ra == 0 || ra == Math.PI) {
                ry = startY;
                rx = startX;
                depth = this.levelWidth * this.levelHeight;
            }

            while (depth < this.levelWidth * this.levelHeight) {
                int i = ((int) Math.floor(ry) * this.levelWidth) + (int) Math.floor(rx);
                if (i > 0 && i < this.levelWidth * this.levelHeight && this.level[i] != 0) {
                    depth = this.levelWidth * this.levelHeight;

                    hitColor = new Color(0xFFFFFF);
                } else {
                    rx += xo;
                    ry += yo;
                    depth++;
                }
            }

            double distance = Math.sqrt(Math.pow(startX - rx, 2) + Math.pow(startY - ry, 2));
            hitDistance = Math.min(hitDistance, distance);
        }

        { // Horizontal lines
            double rx = startX;
            double ry = startY;
            double xo = 0;
            double yo = 0;

            int depth = 0;
            double nTan = -Math.tan(ra);

            if (ra > (Math.PI / 2) && ra < 3 * (Math.PI / 2)) {
                rx = Math.floor(startX) - 0.001;
                ry = (startX - rx) * nTan + startY;
                xo = -1;
                yo = -xo * nTan;
            }
            if (ra < (Math.PI / 2) || ra > 3 * (Math.PI / 2)) {
                rx = Math.floor(startX) + 1;
                ry = (startX - rx) * nTan + startY;
                xo = 1;
                yo = -xo * nTan;
            }
            if (ra == 0 || ra == Math.PI) {
                rx = startX;
                ry = startY;
                depth = this.levelWidth * this.levelHeight;
            }

            while (depth < this.levelWidth * this.levelHeight) {
                int i = ((int) Math.floor(ry) * this.levelWidth) + (int) Math.floor(rx);
                if (i > 0 && i < this.levelWidth * this.levelHeight && this.level[i] != 0) {
                    depth = this.levelWidth * this.levelHeight;

                    hitColor = new Color(0xFFFFFF);
                } else {
                    rx += xo;
                    ry += yo;
                    depth++;
                }
            }

            double distance = Math.sqrt(Math.pow(startX - rx, 2) + Math.pow(startY - ry, 2));
            hitDistance = Math.min(hitDistance, distance);
        }

        if (hitDistance == Double.POSITIVE_INFINITY) {
            return null;
        }
        return new RayResult(hitDistance, hitColor);
    }

    protected abstract void drawPoint(double x, double y, float size, int color);

    protected abstract void drawLine(double startX, double startY, double endX, double endY, float size, int color);

    protected abstract void drawSquare(double x, double y, double width, double height, int color);

    protected void movePlayer(double forward) {
        double dx = Math.sin(this.playerYaw) * forward;
        double dy = Math.cos(this.playerYaw) * forward;

        int x = (int) Math.floor(this.playerX + dx);
        int y = (int) Math.floor(this.playerY + dy);
        if (this.level[(y * this.levelWidth) + x] != 0) {
            return;
        }

        this.playerX += dx;
        this.playerY += dy;
    }

    protected abstract String getTitle();

    protected abstract void setTitle(String title);
}