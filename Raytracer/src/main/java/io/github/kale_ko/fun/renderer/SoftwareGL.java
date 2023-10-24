package io.github.kale_ko.fun.renderer;

import java.nio.IntBuffer;
import java.util.HashMap;
import java.util.Map;
import org.lwjgl.glfw.GLFWErrorCallback;
import org.lwjgl.glfw.GLFWVidMode;
import org.lwjgl.opengl.GL;
import org.lwjgl.opengl.GLCapabilities;
import org.lwjgl.system.MemoryStack;
import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.glfw.Callbacks.*;
import static org.lwjgl.opengl.GL21.*;
import static org.lwjgl.system.MemoryStack.*;
import static org.lwjgl.system.MemoryUtil.*;

public class SoftwareGL extends SoftwareCommon {
    protected int glWidth;
    protected int glHeight;
    protected long glWindow;

    protected Map<Integer, Boolean> keyMap = new HashMap<>();

    public SoftwareGL(int levelWidth, int levelHeight, int[] level, long fpsCap, int displayScale, int playWidth, int playHeight, int playScale, float playFov) {
        super(levelWidth, levelHeight, level, fpsCap, displayScale, playWidth, playHeight, playScale, playFov);

        this.glWidth = (levelWidth * displayScale) + (playWidth * this.playScale);
        this.glHeight = Math.max(levelHeight * displayScale, playHeight);
    }

    @Override
    protected void setup() {
        GLFWErrorCallback.createPrint(System.err).set();

        if (!glfwInit()) {
            throw new RuntimeException("Failed to initialize GLFW");
        }

        glfwDefaultWindowHints();
        glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
        glfwWindowHint(GLFW_FOCUSED, GLFW_TRUE);
        glfwWindowHint(GLFW_FOCUS_ON_SHOW, GLFW_TRUE);
        glfwWindowHint(GLFW_RESIZABLE, GLFW_FALSE);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 2);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);

        this.glWindow = glfwCreateWindow(this.glWidth, this.glHeight, this.getTitle(), NULL, NULL);
        if (this.glWindow == NULL) {
            throw new RuntimeException("Failed to create GLFW window");
        }

        glfwSetKeyCallback(this.glWindow, (long _glWindow, int key, int scanCode, int action, int mods) -> {
            keyMap.remove(key);
            keyMap.put(key, action != GLFW_RELEASE);
        });

        try (MemoryStack stack = stackPush()) {
            IntBuffer pWidth = stack.mallocInt(1);
            IntBuffer pHeight = stack.mallocInt(1);
            glfwGetWindowSize(this.glWindow, pWidth, pHeight);

            GLFWVidMode vidMode = glfwGetVideoMode(glfwGetPrimaryMonitor());
            if (vidMode == null) {
                throw new RuntimeException("Failed to resize GLFW window");
            }

            glfwSetWindowPos(this.glWindow, (vidMode.width() - pWidth.get(0)) / 2, (vidMode.height() - pHeight.get(0)) / 2);
        }

        glfwMakeContextCurrent(this.glWindow);
        glfwSwapInterval(0);

        glfwShowWindow(this.glWindow);

        GLCapabilities glCapabilities = GL.createCapabilities();
        if (!glCapabilities.OpenGL21) {
            throw new RuntimeException("Failed to initialize OpenGL (OpenGL 2.1 or later is required)");
        }

        glDisable(GL_DEPTH);
        glEnable(GL_CULL_FACE);

        glEnable(GL_POINT_SMOOTH);
        glEnable(GL_LINE_SMOOTH);
        glEnable(GL_POLYGON_SMOOTH);

        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    }

    @Override
    protected void destroy() {
        glfwFreeCallbacks(this.glWindow);
        glfwDestroyWindow(this.glWindow);

        glfwTerminate();

        //noinspection DataFlowIssue
        glfwSetErrorCallback(null).free();
    }

    @Override
    public void render(double delta) {
        glClearColor(0.3f, 0.3f, 0.3f, 0.3f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        this.renderDisplay(delta);
        this.renderPlay(delta);

        glfwSwapBuffers(this.glWindow);
        glfwPollEvents();

        if (glfwWindowShouldClose(this.glWindow)) {
            this.running = false;
            return;
        }

        if (keyMap.getOrDefault(GLFW_KEY_W, false) || keyMap.getOrDefault(GLFW_KEY_UP, false)) {
            this.movePlayer(2 * delta);
        }
        if (keyMap.getOrDefault(GLFW_KEY_S, false) || keyMap.getOrDefault(GLFW_KEY_DOWN, false)) {
            this.movePlayer(-2 * delta);
        }
        if (keyMap.getOrDefault(GLFW_KEY_A, false) || keyMap.getOrDefault(GLFW_KEY_LEFT, false)) {
            this.playerYaw += 2 * delta;
        }
        if (keyMap.getOrDefault(GLFW_KEY_D, false) || keyMap.getOrDefault(GLFW_KEY_RIGHT, false)) {
            this.playerYaw += -2 * delta;
        }
    }

    @Override
    protected void drawPoint(double x, double y, float size, int color) {
        glPointSize(size);
        glBegin(GL_POINTS);
        glColor3d(((color & 0xFF0000) >> 16) / 255d, ((color & 0x00FF00) >> 8) / 255d, (color & 0x0000FF) / 255d);
        glVertex2d(((x * 2) / glWidth) - 1, ((-y * 2) / glHeight) + 1);
        glEnd();
    }

    @Override
    protected void drawLine(double startX, double startY, double endX, double endY, float size, int color) {
        glLineWidth(size);
        glBegin(GL_LINES);
        glColor3d(((color & 0xFF0000) >> 16) / 255d, ((color & 0x00FF00) >> 8) / 255d, (color & 0x0000FF) / 255d);
        glVertex2d(((startX * 2) / glWidth) - 1, ((-startY * 2) / glHeight) + 1);
        glVertex2d(((endX * 2) / glWidth) - 1, ((-endY * 2) / glHeight) + 1);
        glEnd();
    }

    @Override
    protected void drawSquare(double x, double y, double width, double height, int color) {
        glBegin(GL_QUADS);
        glColor3d((color & 0xFF0000) / 255d, (color & 0x00FF00) / 255d, (color & 0x0000FF) / 255d);
        glVertex2d((((x * 2) + (width * 2)) / glWidth) - 1, ((-y * 2) / glHeight) + 1);
        glVertex2d(((x * 2) / glWidth) - 1, ((-y * 2) / glHeight) + 1);
        glVertex2d((x * 2) / glWidth - 1, (((-y * 2) + (-height * 2)) / glHeight) + 1);
        glVertex2d((((x * 2) + (width * 2)) / glWidth) - 1, (((-y * 2) + (-height * 2)) / glHeight) + 1);
        glEnd();
    }

    @Override
    public String getTitle() {
        return "Renderer/SoftwareGL - {fps} fps";
    }

    @Override
    public void setTitle(String title) {
        glfwSetWindowTitle(this.glWindow, title);
    }
}