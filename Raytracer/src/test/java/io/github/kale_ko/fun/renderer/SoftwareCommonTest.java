package io.github.kale_ko.fun.renderer;

public class SoftwareCommonTest {
    public static final int levelWidth = 12;
    public static final int levelHeight = 12;
    public static final int[] level = new int[] { //
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, //
            1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, //
            1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, //
            1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, //
            1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, //
            1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, //
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, //
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, //
            1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, //
            1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, //
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, //
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1  //
    };

    public static final long fpsCap = 10000;

    public static final int displayScale = 25;

    public static final int playWidth = 200;
    public static final int playHeight = 150;
    public static final int playScale = 2;

    public static final float playFov = 70 * ((float) Math.PI / 180f);
}