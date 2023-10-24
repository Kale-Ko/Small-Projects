package io.github.kale_ko.fun.renderer;

public class SoftwareGLTest extends SoftwareCommonTest {
    public static void main(String[] args) {
        SoftwareGL renderer = new SoftwareGL(SoftwareCommonTest.levelWidth, SoftwareCommonTest.levelHeight, SoftwareCommonTest.level, SoftwareCommonTest.fpsCap, SoftwareCommonTest.displayScale, SoftwareCommonTest.playWidth, SoftwareCommonTest.playHeight, SoftwareCommonTest.playScale, SoftwareCommonTest.playFov);
        renderer.run();
    }
}