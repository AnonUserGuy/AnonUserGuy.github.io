import * as global from "@js/global.js"
import Color from "./net/xna-color.js";
import BinaryReader from "./net/binary-reader.js";
import BinaryWriter from "./net/binary-writer.js";
import MapTile, { TileGroup } from "./terraria-map-tile.js";
import WorldMap from "./terraria-world-map.js";
import TileID from "./id/tile-ids.js";
import WallID from "./id/wall-ids.js";
import TileData from "./data/tile-data.js";

enum FileType {
    None,
    Map,
    World,
    Player
}

interface FileMetadata {
    magicNumber?: string;
    fileType?: number;
    revision?: number;
    favorite?: boolean;
    isChinese?: boolean;
}

class OldMapHelper {
    public misc: number;
    public misc2: number;

    constructor() {
        this.misc = 0;
        this.misc2 = 0;
    }

    public active() {
        if ((this.misc & 1) == 1) {
            return true;
        }
        return false;
    }

    public water() {
        if ((this.misc & 2) == 2) {
            return true;
        }
        return false;
    }

    public lava() {
        if ((this.misc & 4) == 4) {
            return true;
        }
        return false;
    }

    public honey() {
        if ((this.misc2 & 0x40) == 64) {
            return true;
        }
        return false;
    }

    public changed() {
        if ((this.misc & 8) == 8) {
            return true;
        }
        return false;
    }

    public wall() {
        if ((this.misc & 0x10) == 16) {
            return true;
        }
        return false;
    }

    public option() {
        let b = 0;
        if ((this.misc & 0x20) == 32) {
            b++;
        }
        if ((this.misc & 0x40) == 64) {
            b += 2;
        }
        if ((this.misc & 0x80) == 128) {
            b += 4;
        }
        if ((this.misc2 & 1) == 1) {
            b += 8;
        }
        return b;
    }

    public color() {
        return ((this.misc2 & 0x1E) >> 1);
    }
}

export default class MapHelper {
    public static lastestRelease = 279;

    public static maxLiquidTypes = 4;
    private static maxSkyGradients = 256;
    private static maxDirtGradients = 256;
    private static maxRockGradients = 256;

    private static snowTypes: number[];
    private static colorLookup: Color[];
    public static tileLookup: number[];
    private static tilePosition: number;
    private static wallPosition: number;
    public static wallLookup: number[];
    private static wallRangeStart: number;
    private static wallRangeEnd: number;
    private static liquidPosition: number;
    private static skyPosition: number;
    private static dirtPosition: number;
    private static rockPosition: number;
    private static hellPosition: number;
    public static tileOptionCounts: number[];
    public static wallOptionCounts: number[];

    public static idLookup: number[];
    public static optionLookup: number[];

    static {
        const tileColors: Color[][] = Array(TileID.Count);
        for (let i = 0; i < TileID.Count; i++) {
            tileColors[i] = Array(12);
        }
        tileColors[656][0] = new Color(21, 124, 212);
        tileColors[624][0] = new Color(210, 91, 77);
        tileColors[621][0] = new Color(250, 250, 250);
        tileColors[622][0] = new Color(235, 235, 249);
        tileColors[518][0] = new Color(26, 196, 84);
        tileColors[518][1] = new Color(48, 208, 234);
        tileColors[518][2] = new Color(135, 196, 26);
        tileColors[519][0] = new Color(28, 216, 109);
        tileColors[519][1] = new Color(107, 182, 0);
        tileColors[519][2] = new Color(75, 184, 230);
        tileColors[519][3] = new Color(208, 80, 80);
        tileColors[519][4] = new Color(141, 137, 223);
        tileColors[519][5] = new Color(182, 175, 130);
        tileColors[549][0] = new Color(54, 83, 20);
        tileColors[528][0] = new Color(182, 175, 130);
        tileColors[529][0] = new Color(99, 150, 8);
        tileColors[529][1] = new Color(139, 154, 64);
        tileColors[529][2] = new Color(34, 129, 168);
        tileColors[529][3] = new Color(180, 82, 82);
        tileColors[529][4] = new Color(113, 108, 205);
        let color = new Color(151, 107, 75);
        tileColors[0][0] = color;
        tileColors[668][0] = color;
        tileColors[5][0] = color;
        tileColors[5][1] = new Color(182, 175, 130);
        let color2 = new Color(127, 127, 127);
        tileColors[583][0] = color2;
        tileColors[584][0] = color2;
        tileColors[585][0] = color2;
        tileColors[586][0] = color2;
        tileColors[587][0] = color2;
        tileColors[588][0] = color2;
        tileColors[589][0] = color2;
        tileColors[590][0] = color2;
        tileColors[595][0] = color;
        tileColors[596][0] = color;
        tileColors[615][0] = color;
        tileColors[616][0] = color;
        tileColors[634][0] = new Color(145, 120, 120);
        tileColors[633][0] = new Color(210, 140, 100);
        tileColors[637][0] = new Color(200, 120, 75);
        tileColors[638][0] = new Color(200, 120, 75);
        tileColors[30][0] = color;
        tileColors[191][0] = color;
        tileColors[272][0] = new Color(121, 119, 101);
        color = new Color(128, 128, 128);
        tileColors[1][0] = color;
        tileColors[38][0] = color;
        tileColors[48][0] = color;
        tileColors[130][0] = color;
        tileColors[138][0] = color;
        tileColors[664][0] = color;
        tileColors[273][0] = color;
        tileColors[283][0] = color;
        tileColors[618][0] = color;
        tileColors[654][0] = new Color(200, 44, 28);
        tileColors[2][0] = new Color(28, 216, 94);
        tileColors[477][0] = new Color(28, 216, 94);
        tileColors[492][0] = new Color(78, 193, 227);
        color = new Color(26, 196, 84);
        tileColors[3][0] = color;
        tileColors[192][0] = color;
        tileColors[73][0] = new Color(27, 197, 109);
        tileColors[52][0] = new Color(23, 177, 76);
        tileColors[353][0] = new Color(28, 216, 94);
        tileColors[20][0] = new Color(163, 116, 81);
        tileColors[6][0] = new Color(140, 101, 80);
        color = new Color(150, 67, 22);
        tileColors[7][0] = color;
        tileColors[47][0] = color;
        tileColors[284][0] = color;
        tileColors[682][0] = color;
        tileColors[560][0] = color;
        color = new Color(185, 164, 23);
        tileColors[8][0] = color;
        tileColors[45][0] = color;
        tileColors[680][0] = color;
        tileColors[560][2] = color;
        color = new Color(185, 194, 195);
        tileColors[9][0] = color;
        tileColors[46][0] = color;
        tileColors[681][0] = color;
        tileColors[560][1] = color;
        color = new Color(98, 95, 167);
        tileColors[22][0] = color;
        tileColors[140][0] = color;
        tileColors[23][0] = new Color(141, 137, 223);
        tileColors[24][0] = new Color(122, 116, 218);
        tileColors[636][0] = new Color(122, 116, 218);
        tileColors[25][0] = new Color(109, 90, 128);
        tileColors[37][0] = new Color(104, 86, 84);
        tileColors[39][0] = new Color(181, 62, 59);
        tileColors[40][0] = new Color(146, 81, 68);
        tileColors[41][0] = new Color(66, 84, 109);
        tileColors[677][0] = new Color(66, 84, 109);
        tileColors[481][0] = new Color(66, 84, 109);
        tileColors[43][0] = new Color(84, 100, 63);
        tileColors[678][0] = new Color(84, 100, 63);
        tileColors[482][0] = new Color(84, 100, 63);
        tileColors[44][0] = new Color(107, 68, 99);
        tileColors[679][0] = new Color(107, 68, 99);
        tileColors[483][0] = new Color(107, 68, 99);
        tileColors[53][0] = new Color(186, 168, 84);
        color = new Color(190, 171, 94);
        tileColors[151][0] = color;
        tileColors[154][0] = color;
        tileColors[274][0] = color;
        tileColors[328][0] = new Color(200, 246, 254);
        tileColors[329][0] = new Color(15, 15, 15);
        tileColors[54][0] = new Color(200, 246, 254);
        tileColors[56][0] = new Color(43, 40, 84);
        tileColors[75][0] = new Color(26, 26, 26);
        tileColors[683][0] = new Color(100, 90, 190);
        tileColors[57][0] = new Color(68, 68, 76);
        color = new Color(142, 66, 66);
        tileColors[58][0] = color;
        tileColors[76][0] = color;
        tileColors[684][0] = color;
        color = new Color(92, 68, 73);
        tileColors[59][0] = color;
        tileColors[120][0] = color;
        tileColors[60][0] = new Color(143, 215, 29);
        tileColors[61][0] = new Color(135, 196, 26);
        tileColors[74][0] = new Color(96, 197, 27);
        tileColors[62][0] = new Color(121, 176, 24);
        tileColors[233][0] = new Color(107, 182, 29);
        tileColors[652][0] = tileColors[233][0];
        tileColors[651][0] = tileColors[233][0];
        tileColors[63][0] = new Color(110, 140, 182);
        tileColors[64][0] = new Color(196, 96, 114);
        tileColors[65][0] = new Color(56, 150, 97);
        tileColors[66][0] = new Color(160, 118, 58);
        tileColors[67][0] = new Color(140, 58, 166);
        tileColors[68][0] = new Color(125, 191, 197);
        tileColors[566][0] = new Color(233, 180, 90);
        tileColors[70][0] = new Color(93, 127, 255);
        color = new Color(182, 175, 130);
        tileColors[71][0] = color;
        tileColors[72][0] = color;
        tileColors[190][0] = color;
        tileColors[578][0] = new Color(172, 155, 110);
        color = new Color(73, 120, 17);
        tileColors[80][0] = color;
        tileColors[484][0] = color;
        tileColors[188][0] = color;
        tileColors[80][1] = new Color(87, 84, 151);
        tileColors[80][2] = new Color(34, 129, 168);
        tileColors[80][3] = new Color(130, 56, 55);
        color = new Color(11, 80, 143);
        tileColors[107][0] = color;
        tileColors[121][0] = color;
        tileColors[685][0] = color;
        color = new Color(91, 169, 169);
        tileColors[108][0] = color;
        tileColors[122][0] = color;
        tileColors[686][0] = color;
        color = new Color(128, 26, 52);
        tileColors[111][0] = color;
        tileColors[150][0] = color;
        tileColors[109][0] = new Color(78, 193, 227);
        tileColors[110][0] = new Color(48, 186, 135);
        tileColors[113][0] = new Color(48, 208, 234);
        tileColors[115][0] = new Color(33, 171, 207);
        tileColors[112][0] = new Color(103, 98, 122);
        color = new Color(238, 225, 218);
        tileColors[116][0] = color;
        tileColors[118][0] = color;
        tileColors[117][0] = new Color(181, 172, 190);
        tileColors[119][0] = new Color(107, 92, 108);
        tileColors[123][0] = new Color(106, 107, 118);
        tileColors[124][0] = new Color(73, 51, 36);
        tileColors[131][0] = new Color(52, 52, 52);
        tileColors[145][0] = new Color(192, 30, 30);
        tileColors[146][0] = new Color(43, 192, 30);
        color = new Color(211, 236, 241);
        tileColors[147][0] = color;
        tileColors[148][0] = color;
        tileColors[152][0] = new Color(128, 133, 184);
        tileColors[153][0] = new Color(239, 141, 126);
        tileColors[155][0] = new Color(131, 162, 161);
        tileColors[156][0] = new Color(170, 171, 157);
        tileColors[157][0] = new Color(104, 100, 126);
        color = new Color(145, 81, 85);
        tileColors[158][0] = color;
        tileColors[232][0] = color;
        tileColors[575][0] = new Color(125, 61, 65);
        tileColors[159][0] = new Color(148, 133, 98);
        tileColors[161][0] = new Color(144, 195, 232);
        tileColors[162][0] = new Color(184, 219, 240);
        tileColors[163][0] = new Color(174, 145, 214);
        tileColors[164][0] = new Color(218, 182, 204);
        tileColors[170][0] = new Color(27, 109, 69);
        tileColors[171][0] = new Color(33, 135, 85);
        color = new Color(129, 125, 93);
        tileColors[166][0] = color;
        tileColors[175][0] = color;
        tileColors[167][0] = new Color(62, 82, 114);
        color = new Color(132, 157, 127);
        tileColors[168][0] = color;
        tileColors[176][0] = color;
        color = new Color(152, 171, 198);
        tileColors[169][0] = color;
        tileColors[177][0] = color;
        tileColors[179][0] = new Color(49, 134, 114);
        tileColors[180][0] = new Color(126, 134, 49);
        tileColors[181][0] = new Color(134, 59, 49);
        tileColors[182][0] = new Color(43, 86, 140);
        tileColors[183][0] = new Color(121, 49, 134);
        tileColors[381][0] = new Color(254, 121, 2);
        tileColors[687][0] = new Color(254, 121, 2);
        tileColors[534][0] = new Color(114, 254, 2);
        tileColors[689][0] = new Color(114, 254, 2);
        tileColors[536][0] = new Color(0, 197, 208);
        tileColors[690][0] = new Color(0, 197, 208);
        tileColors[539][0] = new Color(208, 0, 126);
        tileColors[688][0] = new Color(208, 0, 126);
        tileColors[625][0] = new Color(220, 12, 237);
        tileColors[691][0] = new Color(220, 12, 237);
        tileColors[627][0] = new Color(255, 76, 76);
        tileColors[627][1] = new Color(255, 195, 76);
        tileColors[627][2] = new Color(195, 255, 76);
        tileColors[627][3] = new Color(76, 255, 76);
        tileColors[627][4] = new Color(76, 255, 195);
        tileColors[627][5] = new Color(76, 195, 255);
        tileColors[627][6] = new Color(77, 76, 255);
        tileColors[627][7] = new Color(196, 76, 255);
        tileColors[627][8] = new Color(255, 76, 195);
        tileColors[512][0] = new Color(49, 134, 114);
        tileColors[513][0] = new Color(126, 134, 49);
        tileColors[514][0] = new Color(134, 59, 49);
        tileColors[515][0] = new Color(43, 86, 140);
        tileColors[516][0] = new Color(121, 49, 134);
        tileColors[517][0] = new Color(254, 121, 2);
        tileColors[535][0] = new Color(114, 254, 2);
        tileColors[537][0] = new Color(0, 197, 208);
        tileColors[540][0] = new Color(208, 0, 126);
        tileColors[626][0] = new Color(220, 12, 237);
        for (let j = 0; j < tileColors[628].length; j++) {
            tileColors[628][j] = tileColors[627][j];
        }
        for (let k = 0; k < tileColors[692].length; k++) {
            tileColors[692][k] = tileColors[627][k];
        }
        for (let l = 0; l < tileColors[160].length; l++) {
            tileColors[160][l] = tileColors[627][l];
        }
        tileColors[184][0] = new Color(29, 106, 88);
        tileColors[184][1] = new Color(94, 100, 36);
        tileColors[184][2] = new Color(96, 44, 40);
        tileColors[184][3] = new Color(34, 63, 102);
        tileColors[184][4] = new Color(79, 35, 95);
        tileColors[184][5] = new Color(253, 62, 3);
        tileColors[184][6] = new Color(22, 123, 62);
        tileColors[184][7] = new Color(0, 106, 148);
        tileColors[184][8] = new Color(148, 0, 132);
        tileColors[184][9] = new Color(122, 24, 168);
        tileColors[184][10] = new Color(220, 20, 20);
        tileColors[189][0] = new Color(223, 255, 255);
        tileColors[193][0] = new Color(56, 121, 255);
        tileColors[194][0] = new Color(157, 157, 107);
        tileColors[195][0] = new Color(134, 22, 34);
        tileColors[196][0] = new Color(147, 144, 178);
        tileColors[197][0] = new Color(97, 200, 225);
        tileColors[198][0] = new Color(62, 61, 52);
        tileColors[199][0] = new Color(208, 80, 80);
        tileColors[201][0] = new Color(203, 61, 64);
        tileColors[205][0] = new Color(186, 50, 52);
        tileColors[200][0] = new Color(216, 152, 144);
        tileColors[202][0] = new Color(213, 178, 28);
        tileColors[203][0] = new Color(128, 44, 45);
        tileColors[204][0] = new Color(125, 55, 65);
        tileColors[206][0] = new Color(124, 175, 201);
        tileColors[208][0] = new Color(88, 105, 118);
        tileColors[211][0] = new Color(191, 233, 115);
        tileColors[213][0] = new Color(137, 120, 67);
        tileColors[214][0] = new Color(103, 103, 103);
        tileColors[221][0] = new Color(239, 90, 50);
        tileColors[222][0] = new Color(231, 96, 228);
        tileColors[223][0] = new Color(57, 85, 101);
        tileColors[224][0] = new Color(107, 132, 139);
        tileColors[225][0] = new Color(227, 125, 22);
        tileColors[226][0] = new Color(141, 56, 0);
        tileColors[229][0] = new Color(255, 156, 12);
        tileColors[659][0] = new Color(247, 228, 254);
        tileColors[230][0] = new Color(131, 79, 13);
        tileColors[234][0] = new Color(53, 44, 41);
        tileColors[235][0] = new Color(214, 184, 46);
        tileColors[236][0] = new Color(149, 232, 87);
        tileColors[237][0] = new Color(255, 241, 51);
        tileColors[238][0] = new Color(225, 128, 206);
        tileColors[655][0] = new Color(225, 128, 206);
        tileColors[243][0] = new Color(198, 196, 170);
        tileColors[248][0] = new Color(219, 71, 38);
        tileColors[249][0] = new Color(235, 38, 231);
        tileColors[250][0] = new Color(86, 85, 92);
        tileColors[251][0] = new Color(235, 150, 23);
        tileColors[252][0] = new Color(153, 131, 44);
        tileColors[253][0] = new Color(57, 48, 97);
        tileColors[254][0] = new Color(248, 158, 92);
        tileColors[255][0] = new Color(107, 49, 154);
        tileColors[256][0] = new Color(154, 148, 49);
        tileColors[257][0] = new Color(49, 49, 154);
        tileColors[258][0] = new Color(49, 154, 68);
        tileColors[259][0] = new Color(154, 49, 77);
        tileColors[260][0] = new Color(85, 89, 118);
        tileColors[261][0] = new Color(154, 83, 49);
        tileColors[262][0] = new Color(221, 79, 255);
        tileColors[263][0] = new Color(250, 255, 79);
        tileColors[264][0] = new Color(79, 102, 255);
        tileColors[265][0] = new Color(79, 255, 89);
        tileColors[266][0] = new Color(255, 79, 79);
        tileColors[267][0] = new Color(240, 240, 247);
        tileColors[268][0] = new Color(255, 145, 79);
        tileColors[287][0] = new Color(79, 128, 17);
        color = new Color(122, 217, 232);
        tileColors[275][0] = color;
        tileColors[276][0] = color;
        tileColors[277][0] = color;
        tileColors[278][0] = color;
        tileColors[279][0] = color;
        tileColors[280][0] = color;
        tileColors[281][0] = color;
        tileColors[282][0] = color;
        tileColors[285][0] = color;
        tileColors[286][0] = color;
        tileColors[288][0] = color;
        tileColors[289][0] = color;
        tileColors[290][0] = color;
        tileColors[291][0] = color;
        tileColors[292][0] = color;
        tileColors[293][0] = color;
        tileColors[294][0] = color;
        tileColors[295][0] = color;
        tileColors[296][0] = color;
        tileColors[297][0] = color;
        tileColors[298][0] = color;
        tileColors[299][0] = color;
        tileColors[309][0] = color;
        tileColors[310][0] = color;
        tileColors[413][0] = color;
        tileColors[339][0] = color;
        tileColors[542][0] = color;
        tileColors[632][0] = color;
        tileColors[640][0] = color;
        tileColors[643][0] = color;
        tileColors[644][0] = color;
        tileColors[645][0] = color;
        tileColors[358][0] = color;
        tileColors[359][0] = color;
        tileColors[360][0] = color;
        tileColors[361][0] = color;
        tileColors[362][0] = color;
        tileColors[363][0] = color;
        tileColors[364][0] = color;
        tileColors[391][0] = color;
        tileColors[392][0] = color;
        tileColors[393][0] = color;
        tileColors[394][0] = color;
        tileColors[414][0] = color;
        tileColors[505][0] = color;
        tileColors[543][0] = color;
        tileColors[598][0] = color;
        tileColors[521][0] = color;
        tileColors[522][0] = color;
        tileColors[523][0] = color;
        tileColors[524][0] = color;
        tileColors[525][0] = color;
        tileColors[526][0] = color;
        tileColors[527][0] = color;
        tileColors[532][0] = color;
        tileColors[533][0] = color;
        tileColors[538][0] = color;
        tileColors[544][0] = color;
        tileColors[629][0] = color;
        tileColors[550][0] = color;
        tileColors[551][0] = color;
        tileColors[553][0] = color;
        tileColors[554][0] = color;
        tileColors[555][0] = color;
        tileColors[556][0] = color;
        tileColors[558][0] = color;
        tileColors[559][0] = color;
        tileColors[580][0] = color;
        tileColors[582][0] = color;
        tileColors[599][0] = color;
        tileColors[600][0] = color;
        tileColors[601][0] = color;
        tileColors[602][0] = color;
        tileColors[603][0] = color;
        tileColors[604][0] = color;
        tileColors[605][0] = color;
        tileColors[606][0] = color;
        tileColors[607][0] = color;
        tileColors[608][0] = color;
        tileColors[609][0] = color;
        tileColors[610][0] = color;
        tileColors[611][0] = color;
        tileColors[612][0] = color;
        tileColors[619][0] = color;
        tileColors[620][0] = color;
        tileColors[630][0] = new Color(117, 145, 73);
        tileColors[631][0] = new Color(122, 234, 225);
        tileColors[552][0] = tileColors[53][0];
        tileColors[564][0] = new Color(87, 127, 220);
        tileColors[408][0] = new Color(85, 83, 82);
        tileColors[409][0] = new Color(85, 83, 82);
        tileColors[669][0] = new Color(83, 46, 57);
        tileColors[670][0] = new Color(91, 87, 167);
        tileColors[671][0] = new Color(23, 33, 81);
        tileColors[672][0] = new Color(53, 133, 103);
        tileColors[673][0] = new Color(11, 67, 80);
        tileColors[674][0] = new Color(40, 49, 60);
        tileColors[675][0] = new Color(21, 13, 77);
        tileColors[676][0] = new Color(195, 201, 215);
        tileColors[415][0] = new Color(249, 75, 7);
        tileColors[416][0] = new Color(0, 160, 170);
        tileColors[417][0] = new Color(160, 87, 234);
        tileColors[418][0] = new Color(22, 173, 254);
        tileColors[489][0] = new Color(255, 29, 136);
        tileColors[490][0] = new Color(211, 211, 211);
        tileColors[311][0] = new Color(117, 61, 25);
        tileColors[312][0] = new Color(204, 93, 73);
        tileColors[313][0] = new Color(87, 150, 154);
        tileColors[4][0] = new Color(253, 221, 3);
        tileColors[4][1] = new Color(253, 221, 3);
        color = new Color(253, 221, 3);
        tileColors[93][0] = color;
        tileColors[33][0] = color;
        tileColors[174][0] = color;
        tileColors[100][0] = color;
        tileColors[98][0] = color;
        tileColors[173][0] = color;
        color = new Color(119, 105, 79);
        tileColors[11][0] = color;
        tileColors[10][0] = color;
        tileColors[593][0] = color;
        tileColors[594][0] = color;
        color = new Color(191, 142, 111);
        tileColors[14][0] = color;
        tileColors[469][0] = color;
        tileColors[486][0] = color;
        tileColors[488][0] = new Color(127, 92, 69);
        tileColors[487][0] = color;
        tileColors[487][1] = color;
        tileColors[15][0] = color;
        tileColors[15][1] = color;
        tileColors[497][0] = color;
        tileColors[18][0] = color;
        tileColors[19][0] = color;
        tileColors[19][1] = Color.Black;
        tileColors[55][0] = color;
        tileColors[79][0] = color;
        tileColors[86][0] = color;
        tileColors[87][0] = color;
        tileColors[88][0] = color;
        tileColors[89][0] = color;
        tileColors[89][1] = color;
        tileColors[89][2] = new Color(105, 107, 125);
        tileColors[94][0] = color;
        tileColors[101][0] = color;
        tileColors[104][0] = color;
        tileColors[106][0] = color;
        tileColors[114][0] = color;
        tileColors[128][0] = color;
        tileColors[139][0] = color;
        tileColors[172][0] = color;
        tileColors[216][0] = color;
        tileColors[269][0] = color;
        tileColors[334][0] = color;
        tileColors[471][0] = color;
        tileColors[470][0] = color;
        tileColors[475][0] = color;
        tileColors[377][0] = color;
        tileColors[380][0] = color;
        tileColors[395][0] = color;
        tileColors[573][0] = color;
        tileColors[12][0] = new Color(174, 24, 69);
        tileColors[665][0] = new Color(174, 24, 69);
        tileColors[639][0] = new Color(110, 105, 255);
        tileColors[13][0] = new Color(133, 213, 247);
        color = new Color(144, 148, 144);
        tileColors[17][0] = color;
        tileColors[90][0] = color;
        tileColors[96][0] = color;
        tileColors[97][0] = color;
        tileColors[99][0] = color;
        tileColors[132][0] = color;
        tileColors[142][0] = color;
        tileColors[143][0] = color;
        tileColors[144][0] = color;
        tileColors[207][0] = color;
        tileColors[209][0] = color;
        tileColors[212][0] = color;
        tileColors[217][0] = color;
        tileColors[218][0] = color;
        tileColors[219][0] = color;
        tileColors[220][0] = color;
        tileColors[228][0] = color;
        tileColors[300][0] = color;
        tileColors[301][0] = color;
        tileColors[302][0] = color;
        tileColors[303][0] = color;
        tileColors[304][0] = color;
        tileColors[305][0] = color;
        tileColors[306][0] = color;
        tileColors[307][0] = color;
        tileColors[308][0] = color;
        tileColors[567][0] = color;
        tileColors[349][0] = new Color(144, 148, 144);
        tileColors[531][0] = new Color(144, 148, 144);
        tileColors[105][0] = new Color(144, 148, 144);
        tileColors[105][1] = new Color(177, 92, 31);
        tileColors[105][2] = new Color(201, 188, 170);
        tileColors[137][0] = new Color(144, 148, 144);
        tileColors[137][1] = new Color(141, 56, 0);
        tileColors[137][2] = new Color(144, 148, 144);
        tileColors[16][0] = new Color(140, 130, 116);
        tileColors[26][0] = new Color(119, 101, 125);
        tileColors[26][1] = new Color(214, 127, 133);
        tileColors[36][0] = new Color(230, 89, 92);
        tileColors[28][0] = new Color(151, 79, 80);
        tileColors[28][1] = new Color(90, 139, 140);
        tileColors[28][2] = new Color(192, 136, 70);
        tileColors[28][3] = new Color(203, 185, 151);
        tileColors[28][4] = new Color(73, 56, 41);
        tileColors[28][5] = new Color(148, 159, 67);
        tileColors[28][6] = new Color(138, 172, 67);
        tileColors[28][7] = new Color(226, 122, 47);
        tileColors[28][8] = new Color(198, 87, 93);
        for (let m = 0; m < tileColors[653].length; m++) {
            tileColors[653][m] = tileColors[28][m];
        }
        tileColors[29][0] = new Color(175, 105, 128);
        tileColors[51][0] = new Color(192, 202, 203);
        tileColors[31][0] = new Color(141, 120, 168);
        tileColors[31][1] = new Color(212, 105, 105);
        tileColors[32][0] = new Color(151, 135, 183);
        tileColors[42][0] = new Color(251, 235, 127);
        tileColors[50][0] = new Color(170, 48, 114);
        tileColors[85][0] = new Color(192, 192, 192);
        tileColors[69][0] = new Color(190, 150, 92);
        tileColors[77][0] = new Color(238, 85, 70);
        tileColors[81][0] = new Color(245, 133, 191);
        tileColors[78][0] = new Color(121, 110, 97);
        tileColors[141][0] = new Color(192, 59, 59);
        tileColors[129][0] = new Color(255, 117, 224);
        tileColors[129][1] = new Color(255, 117, 224);
        tileColors[126][0] = new Color(159, 209, 229);
        tileColors[125][0] = new Color(141, 175, 255);
        tileColors[103][0] = new Color(141, 98, 77);
        tileColors[95][0] = new Color(255, 162, 31);
        tileColors[92][0] = new Color(213, 229, 237);
        tileColors[91][0] = new Color(13, 88, 130);
        tileColors[215][0] = new Color(254, 121, 2);
        tileColors[592][0] = new Color(254, 121, 2);
        tileColors[316][0] = new Color(157, 176, 226);
        tileColors[317][0] = new Color(118, 227, 129);
        tileColors[318][0] = new Color(227, 118, 215);
        tileColors[319][0] = new Color(96, 68, 48);
        tileColors[320][0] = new Color(203, 185, 151);
        tileColors[321][0] = new Color(96, 77, 64);
        tileColors[574][0] = new Color(76, 57, 44);
        tileColors[322][0] = new Color(198, 170, 104);
        tileColors[635][0] = new Color(145, 120, 120);
        tileColors[149][0] = new Color(220, 50, 50);
        tileColors[149][1] = new Color(0, 220, 50);
        tileColors[149][2] = new Color(50, 50, 220);
        tileColors[133][0] = new Color(231, 53, 56);
        tileColors[133][1] = new Color(192, 189, 221);
        tileColors[134][0] = new Color(166, 187, 153);
        tileColors[134][1] = new Color(241, 129, 249);
        tileColors[102][0] = new Color(229, 212, 73);
        tileColors[35][0] = new Color(226, 145, 30);
        tileColors[34][0] = new Color(235, 166, 135);
        tileColors[136][0] = new Color(213, 203, 204);
        tileColors[231][0] = new Color(224, 194, 101);
        tileColors[239][0] = new Color(224, 194, 101);
        tileColors[240][0] = new Color(120, 85, 60);
        tileColors[240][1] = new Color(99, 50, 30);
        tileColors[240][2] = new Color(153, 153, 117);
        tileColors[240][3] = new Color(112, 84, 56);
        tileColors[240][4] = new Color(234, 231, 226);
        tileColors[241][0] = new Color(77, 74, 72);
        tileColors[244][0] = new Color(200, 245, 253);
        color = new Color(99, 50, 30);
        tileColors[242][0] = color;
        tileColors[245][0] = color;
        tileColors[246][0] = color;
        tileColors[242][1] = new Color(185, 142, 97);
        tileColors[247][0] = new Color(140, 150, 150);
        tileColors[271][0] = new Color(107, 250, 255);
        tileColors[270][0] = new Color(187, 255, 107);
        tileColors[581][0] = new Color(255, 150, 150);
        tileColors[660][0] = new Color(255, 150, 150);
        tileColors[572][0] = new Color(255, 186, 212);
        tileColors[572][1] = new Color(209, 201, 255);
        tileColors[572][2] = new Color(200, 254, 255);
        tileColors[572][3] = new Color(199, 255, 211);
        tileColors[572][4] = new Color(180, 209, 255);
        tileColors[572][5] = new Color(255, 220, 214);
        tileColors[314][0] = new Color(181, 164, 125);
        tileColors[324][0] = new Color(228, 213, 173);
        tileColors[351][0] = new Color(31, 31, 31);
        tileColors[424][0] = new Color(146, 155, 187);
        tileColors[429][0] = new Color(220, 220, 220);
        tileColors[445][0] = new Color(240, 240, 240);
        tileColors[21][0] = new Color(174, 129, 92);
        tileColors[21][1] = new Color(233, 207, 94);
        tileColors[21][2] = new Color(137, 128, 200);
        tileColors[21][3] = new Color(160, 160, 160);
        tileColors[21][4] = new Color(106, 210, 255);
        tileColors[441][0] = tileColors[21][0];
        tileColors[441][1] = tileColors[21][1];
        tileColors[441][2] = tileColors[21][2];
        tileColors[441][3] = tileColors[21][3];
        tileColors[441][4] = tileColors[21][4];
        tileColors[27][0] = new Color(54, 154, 54);
        tileColors[27][1] = new Color(226, 196, 49);
        color = new Color(246, 197, 26);
        tileColors[82][0] = color;
        tileColors[83][0] = color;
        tileColors[84][0] = color;
        color = new Color(76, 150, 216);
        tileColors[82][1] = color;
        tileColors[83][1] = color;
        tileColors[84][1] = color;
        color = new Color(185, 214, 42);
        tileColors[82][2] = color;
        tileColors[83][2] = color;
        tileColors[84][2] = color;
        color = new Color(167, 203, 37);
        tileColors[82][3] = color;
        tileColors[83][3] = color;
        tileColors[84][3] = color;
        tileColors[591][6] = color;
        color = new Color(32, 168, 117);
        tileColors[82][4] = color;
        tileColors[83][4] = color;
        tileColors[84][4] = color;
        color = new Color(177, 69, 49);
        tileColors[82][5] = color;
        tileColors[83][5] = color;
        tileColors[84][5] = color;
        color = new Color(40, 152, 240);
        tileColors[82][6] = color;
        tileColors[83][6] = color;
        tileColors[84][6] = color;
        tileColors[591][1] = new Color(246, 197, 26);
        tileColors[591][2] = new Color(76, 150, 216);
        tileColors[591][3] = new Color(32, 168, 117);
        tileColors[591][4] = new Color(40, 152, 240);
        tileColors[591][5] = new Color(114, 81, 56);
        tileColors[591][6] = new Color(141, 137, 223);
        tileColors[591][7] = new Color(208, 80, 80);
        tileColors[591][8] = new Color(177, 69, 49);
        tileColors[165][0] = new Color(115, 173, 229);
        tileColors[165][1] = new Color(100, 100, 100);
        tileColors[165][2] = new Color(152, 152, 152);
        tileColors[165][3] = new Color(227, 125, 22);
        tileColors[178][0] = new Color(208, 94, 201);
        tileColors[178][1] = new Color(233, 146, 69);
        tileColors[178][2] = new Color(71, 146, 251);
        tileColors[178][3] = new Color(60, 226, 133);
        tileColors[178][4] = new Color(250, 30, 71);
        tileColors[178][5] = new Color(166, 176, 204);
        tileColors[178][6] = new Color(255, 217, 120);
        color = new Color(99, 99, 99);
        tileColors[185][0] = color;
        tileColors[186][0] = color;
        tileColors[187][0] = color;
        tileColors[565][0] = color;
        tileColors[579][0] = color;
        color = new Color(114, 81, 56);
        tileColors[185][1] = color;
        tileColors[186][1] = color;
        tileColors[187][1] = color;
        tileColors[591][0] = color;
        color = new Color(133, 133, 101);
        tileColors[185][2] = color;
        tileColors[186][2] = color;
        tileColors[187][2] = color;
        color = new Color(151, 200, 211);
        tileColors[185][3] = color;
        tileColors[186][3] = color;
        tileColors[187][3] = color;
        color = new Color(177, 183, 161);
        tileColors[185][4] = color;
        tileColors[186][4] = color;
        tileColors[187][4] = color;
        color = new Color(134, 114, 38);
        tileColors[185][5] = color;
        tileColors[186][5] = color;
        tileColors[187][5] = color;
        color = new Color(82, 62, 66);
        tileColors[185][6] = color;
        tileColors[186][6] = color;
        tileColors[187][6] = color;
        color = new Color(143, 117, 121);
        tileColors[185][7] = color;
        tileColors[186][7] = color;
        tileColors[187][7] = color;
        color = new Color(177, 92, 31);
        tileColors[185][8] = color;
        tileColors[186][8] = color;
        tileColors[187][8] = color;
        color = new Color(85, 73, 87);
        tileColors[185][9] = color;
        tileColors[186][9] = color;
        tileColors[187][9] = color;
        color = new Color(26, 196, 84);
        tileColors[185][10] = color;
        tileColors[186][10] = color;
        tileColors[187][10] = color;
        let array2 = tileColors[647];
        for (let n = 0; n < array2.length; n++) {
            array2[n] = tileColors[186][n];
        }
        array2 = tileColors[648];
        for (let num = 0; num < array2.length; num++) {
            array2[num] = tileColors[187][num];
        }
        array2 = tileColors[650];
        for (let num2 = 0; num2 < array2.length; num2++) {
            array2[num2] = tileColors[185][num2];
        }
        array2 = tileColors[649];
        for (let num3 = 0; num3 < array2.length; num3++) {
            array2[num3] = tileColors[185][num3];
        }
        tileColors[227][0] = new Color(74, 197, 155);
        tileColors[227][1] = new Color(54, 153, 88);
        tileColors[227][2] = new Color(63, 126, 207);
        tileColors[227][3] = new Color(240, 180, 4);
        tileColors[227][4] = new Color(45, 68, 168);
        tileColors[227][5] = new Color(61, 92, 0);
        tileColors[227][6] = new Color(216, 112, 152);
        tileColors[227][7] = new Color(200, 40, 24);
        tileColors[227][8] = new Color(113, 45, 133);
        tileColors[227][9] = new Color(235, 137, 2);
        tileColors[227][10] = new Color(41, 152, 135);
        tileColors[227][11] = new Color(198, 19, 78);
        tileColors[373][0] = new Color(9, 61, 191);
        tileColors[374][0] = new Color(253, 32, 3);
        tileColors[375][0] = new Color(255, 156, 12);
        tileColors[461][0] = new Color(212, 192, 100);
        tileColors[461][1] = new Color(137, 132, 156);
        tileColors[461][2] = new Color(148, 122, 112);
        tileColors[461][3] = new Color(221, 201, 206);
        tileColors[323][0] = new Color(182, 141, 86);
        tileColors[325][0] = new Color(129, 125, 93);
        tileColors[326][0] = new Color(9, 61, 191);
        tileColors[327][0] = new Color(253, 32, 3);
        tileColors[507][0] = new Color(5, 5, 5);
        tileColors[508][0] = new Color(5, 5, 5);
        tileColors[330][0] = new Color(226, 118, 76);
        tileColors[331][0] = new Color(161, 172, 173);
        tileColors[332][0] = new Color(204, 181, 72);
        tileColors[333][0] = new Color(190, 190, 178);
        tileColors[335][0] = new Color(217, 174, 137);
        tileColors[336][0] = new Color(253, 62, 3);
        tileColors[337][0] = new Color(144, 148, 144);
        tileColors[338][0] = new Color(85, 255, 160);
        tileColors[315][0] = new Color(235, 114, 80);
        tileColors[641][0] = new Color(235, 125, 150);
        tileColors[340][0] = new Color(96, 248, 2);
        tileColors[341][0] = new Color(105, 74, 202);
        tileColors[342][0] = new Color(29, 240, 255);
        tileColors[343][0] = new Color(254, 202, 80);
        tileColors[344][0] = new Color(131, 252, 245);
        tileColors[345][0] = new Color(255, 156, 12);
        tileColors[346][0] = new Color(149, 212, 89);
        tileColors[642][0] = new Color(149, 212, 89);
        tileColors[347][0] = new Color(236, 74, 79);
        tileColors[348][0] = new Color(44, 26, 233);
        tileColors[350][0] = new Color(55, 97, 155);
        tileColors[352][0] = new Color(238, 97, 94);
        tileColors[354][0] = new Color(141, 107, 89);
        tileColors[355][0] = new Color(141, 107, 89);
        tileColors[463][0] = new Color(155, 214, 240);
        tileColors[491][0] = new Color(60, 20, 160);
        tileColors[464][0] = new Color(233, 183, 128);
        tileColors[465][0] = new Color(51, 84, 195);
        tileColors[466][0] = new Color(205, 153, 73);
        tileColors[356][0] = new Color(233, 203, 24);
        tileColors[663][0] = new Color(24, 203, 233);
        tileColors[357][0] = new Color(168, 178, 204);
        tileColors[367][0] = new Color(168, 178, 204);
        tileColors[561][0] = new Color(148, 158, 184);
        tileColors[365][0] = new Color(146, 136, 205);
        tileColors[366][0] = new Color(223, 232, 233);
        tileColors[368][0] = new Color(50, 46, 104);
        tileColors[369][0] = new Color(50, 46, 104);
        tileColors[576][0] = new Color(30, 26, 84);
        tileColors[370][0] = new Color(127, 116, 194);
        tileColors[49][0] = new Color(89, 201, 255);
        tileColors[372][0] = new Color(252, 128, 201);
        tileColors[646][0] = new Color(108, 133, 140);
        tileColors[371][0] = new Color(249, 101, 189);
        tileColors[376][0] = new Color(160, 120, 92);
        tileColors[378][0] = new Color(160, 120, 100);
        tileColors[379][0] = new Color(251, 209, 240);
        tileColors[382][0] = new Color(28, 216, 94);
        tileColors[383][0] = new Color(221, 136, 144);
        tileColors[384][0] = new Color(131, 206, 12);
        tileColors[385][0] = new Color(87, 21, 144);
        tileColors[386][0] = new Color(127, 92, 69);
        tileColors[387][0] = new Color(127, 92, 69);
        tileColors[388][0] = new Color(127, 92, 69);
        tileColors[389][0] = new Color(127, 92, 69);
        tileColors[390][0] = new Color(253, 32, 3);
        tileColors[397][0] = new Color(212, 192, 100);
        tileColors[396][0] = new Color(198, 124, 78);
        tileColors[577][0] = new Color(178, 104, 58);
        tileColors[398][0] = new Color(100, 82, 126);
        tileColors[399][0] = new Color(77, 76, 66);
        tileColors[400][0] = new Color(96, 68, 117);
        tileColors[401][0] = new Color(68, 60, 51);
        tileColors[402][0] = new Color(174, 168, 186);
        tileColors[403][0] = new Color(205, 152, 186);
        tileColors[404][0] = new Color(212, 148, 88);
        tileColors[405][0] = new Color(140, 140, 140);
        tileColors[406][0] = new Color(120, 120, 120);
        tileColors[407][0] = new Color(255, 227, 132);
        tileColors[411][0] = new Color(227, 46, 46);
        tileColors[494][0] = new Color(227, 227, 227);
        tileColors[421][0] = new Color(65, 75, 90);
        tileColors[422][0] = new Color(65, 75, 90);
        tileColors[425][0] = new Color(146, 155, 187);
        tileColors[426][0] = new Color(168, 38, 47);
        tileColors[430][0] = new Color(39, 168, 96);
        tileColors[431][0] = new Color(39, 94, 168);
        tileColors[432][0] = new Color(242, 221, 100);
        tileColors[433][0] = new Color(224, 100, 242);
        tileColors[434][0] = new Color(197, 193, 216);
        tileColors[427][0] = new Color(183, 53, 62);
        tileColors[435][0] = new Color(54, 183, 111);
        tileColors[436][0] = new Color(54, 109, 183);
        tileColors[437][0] = new Color(255, 236, 115);
        tileColors[438][0] = new Color(239, 115, 255);
        tileColors[439][0] = new Color(212, 208, 231);
        tileColors[440][0] = new Color(238, 51, 53);
        tileColors[440][1] = new Color(13, 107, 216);
        tileColors[440][2] = new Color(33, 184, 115);
        tileColors[440][3] = new Color(255, 221, 62);
        tileColors[440][4] = new Color(165, 0, 236);
        tileColors[440][5] = new Color(223, 230, 238);
        tileColors[440][6] = new Color(207, 101, 0);
        tileColors[419][0] = new Color(88, 95, 114);
        tileColors[419][1] = new Color(214, 225, 236);
        tileColors[419][2] = new Color(25, 131, 205);
        tileColors[423][0] = new Color(245, 197, 1);
        tileColors[423][1] = new Color(185, 0, 224);
        tileColors[423][2] = new Color(58, 240, 111);
        tileColors[423][3] = new Color(50, 107, 197);
        tileColors[423][4] = new Color(253, 91, 3);
        tileColors[423][5] = new Color(254, 194, 20);
        tileColors[423][6] = new Color(174, 195, 215);
        tileColors[420][0] = new Color(99, 255, 107);
        tileColors[420][1] = new Color(99, 255, 107);
        tileColors[420][4] = new Color(99, 255, 107);
        tileColors[420][2] = new Color(218, 2, 5);
        tileColors[420][3] = new Color(218, 2, 5);
        tileColors[420][5] = new Color(218, 2, 5);
        tileColors[476][0] = new Color(160, 160, 160);
        tileColors[410][0] = new Color(75, 139, 166);
        tileColors[480][0] = new Color(120, 50, 50);
        tileColors[509][0] = new Color(50, 50, 60);
        tileColors[657][0] = new Color(35, 205, 215);
        tileColors[658][0] = new Color(200, 105, 230);
        tileColors[412][0] = new Color(75, 139, 166);
        tileColors[443][0] = new Color(144, 148, 144);
        tileColors[442][0] = new Color(3, 144, 201);
        tileColors[444][0] = new Color(191, 176, 124);
        tileColors[446][0] = new Color(255, 66, 152);
        tileColors[447][0] = new Color(179, 132, 255);
        tileColors[448][0] = new Color(0, 206, 180);
        tileColors[449][0] = new Color(91, 186, 240);
        tileColors[450][0] = new Color(92, 240, 91);
        tileColors[451][0] = new Color(240, 91, 147);
        tileColors[452][0] = new Color(255, 150, 181);
        tileColors[453][0] = new Color(179, 132, 255);
        tileColors[453][1] = new Color(0, 206, 180);
        tileColors[453][2] = new Color(255, 66, 152);
        tileColors[454][0] = new Color(174, 16, 176);
        tileColors[455][0] = new Color(48, 225, 110);
        tileColors[456][0] = new Color(179, 132, 255);
        tileColors[457][0] = new Color(150, 164, 206);
        tileColors[457][1] = new Color(255, 132, 184);
        tileColors[457][2] = new Color(74, 255, 232);
        tileColors[457][3] = new Color(215, 159, 255);
        tileColors[457][4] = new Color(229, 219, 234);
        tileColors[458][0] = new Color(211, 198, 111);
        tileColors[459][0] = new Color(190, 223, 232);
        tileColors[460][0] = new Color(141, 163, 181);
        tileColors[462][0] = new Color(231, 178, 28);
        tileColors[467][0] = new Color(129, 56, 121);
        tileColors[467][1] = new Color(255, 249, 59);
        tileColors[467][2] = new Color(161, 67, 24);
        tileColors[467][3] = new Color(89, 70, 72);
        tileColors[467][4] = new Color(233, 207, 94);
        tileColors[467][5] = new Color(254, 158, 35);
        tileColors[467][6] = new Color(34, 221, 151);
        tileColors[467][7] = new Color(249, 170, 236);
        tileColors[467][8] = new Color(35, 200, 254);
        tileColors[467][9] = new Color(190, 200, 200);
        tileColors[467][10] = new Color(230, 170, 100);
        tileColors[467][11] = new Color(165, 168, 26);
        for (let num4 = 0; num4 < 12; num4++) {
            tileColors[468][num4] = tileColors[467][num4];
        }
        tileColors[472][0] = new Color(190, 160, 140);
        tileColors[473][0] = new Color(85, 114, 123);
        tileColors[474][0] = new Color(116, 94, 97);
        tileColors[478][0] = new Color(108, 34, 35);
        tileColors[479][0] = new Color(178, 114, 68);
        tileColors[485][0] = new Color(198, 134, 88);
        tileColors[492][0] = new Color(78, 193, 227);
        tileColors[492][0] = new Color(78, 193, 227);
        tileColors[493][0] = new Color(250, 249, 252);
        tileColors[493][1] = new Color(240, 90, 90);
        tileColors[493][2] = new Color(98, 230, 92);
        tileColors[493][3] = new Color(95, 197, 238);
        tileColors[493][4] = new Color(241, 221, 100);
        tileColors[493][5] = new Color(213, 92, 237);
        tileColors[494][0] = new Color(224, 219, 236);
        tileColors[495][0] = new Color(253, 227, 215);
        tileColors[496][0] = new Color(165, 159, 153);
        tileColors[498][0] = new Color(202, 174, 165);
        tileColors[499][0] = new Color(160, 187, 142);
        tileColors[500][0] = new Color(254, 158, 35);
        tileColors[501][0] = new Color(34, 221, 151);
        tileColors[502][0] = new Color(249, 170, 236);
        tileColors[503][0] = new Color(35, 200, 254);
        tileColors[506][0] = new Color(61, 61, 61);
        tileColors[510][0] = new Color(191, 142, 111);
        tileColors[511][0] = new Color(187, 68, 74);
        tileColors[520][0] = new Color(224, 219, 236);
        tileColors[545][0] = new Color(255, 126, 145);
        tileColors[530][0] = new Color(107, 182, 0);
        tileColors[530][1] = new Color(23, 154, 209);
        tileColors[530][2] = new Color(238, 97, 94);
        tileColors[530][3] = new Color(113, 108, 205);
        tileColors[546][0] = new Color(60, 60, 60);
        tileColors[557][0] = new Color(60, 60, 60);
        tileColors[547][0] = new Color(120, 110, 100);
        tileColors[548][0] = new Color(120, 110, 100);
        tileColors[562][0] = new Color(165, 168, 26);
        tileColors[563][0] = new Color(165, 168, 26);
        tileColors[571][0] = new Color(165, 168, 26);
        tileColors[568][0] = new Color(248, 203, 233);
        tileColors[569][0] = new Color(203, 248, 218);
        tileColors[570][0] = new Color(160, 242, 255);
        tileColors[597][0] = new Color(28, 216, 94);
        tileColors[597][1] = new Color(183, 237, 20);
        tileColors[597][2] = new Color(185, 83, 200);
        tileColors[597][3] = new Color(131, 128, 168);
        tileColors[597][4] = new Color(38, 142, 214);
        tileColors[597][5] = new Color(229, 154, 9);
        tileColors[597][6] = new Color(142, 227, 234);
        tileColors[597][7] = new Color(98, 111, 223);
        tileColors[597][8] = new Color(241, 233, 158);
        tileColors[617][0] = new Color(233, 207, 94);
        let color3 = new Color(250, 100, 50);
        tileColors[548][1] = color3;
        tileColors[613][0] = color3;
        tileColors[614][0] = color3;
        tileColors[623][0] = new Color(220, 210, 245);
        tileColors[661][0] = new Color(141, 137, 223);
        tileColors[662][0] = new Color(208, 80, 80);
        tileColors[666][0] = new Color(115, 60, 40);
        tileColors[667][0] = new Color(247, 228, 254);
        const liquidColors =
            [
                new Color(9, 61, 191),
                new Color(253, 32, 3),
                new Color(254, 194, 20),
                new Color(161, 127, 255)
            ];
        const wallColors: Color[][] = Array(WallID.Count);
        for (let num5 = 0; num5 < WallID.Count; num5++) {
            wallColors[num5] = Array(2);
        }
        wallColors[158][0] = new Color(107, 49, 154);
        wallColors[163][0] = new Color(154, 148, 49);
        wallColors[162][0] = new Color(49, 49, 154);
        wallColors[160][0] = new Color(49, 154, 68);
        wallColors[161][0] = new Color(154, 49, 77);
        wallColors[159][0] = new Color(85, 89, 118);
        wallColors[157][0] = new Color(154, 83, 49);
        wallColors[154][0] = new Color(221, 79, 255);
        wallColors[166][0] = new Color(250, 255, 79);
        wallColors[165][0] = new Color(79, 102, 255);
        wallColors[156][0] = new Color(79, 255, 89);
        wallColors[164][0] = new Color(255, 79, 79);
        wallColors[155][0] = new Color(240, 240, 247);
        wallColors[153][0] = new Color(255, 145, 79);
        wallColors[169][0] = new Color(5, 5, 5);
        wallColors[224][0] = new Color(57, 55, 52);
        wallColors[323][0] = new Color(55, 25, 33);
        wallColors[324][0] = new Color(60, 55, 145);
        wallColors[325][0] = new Color(10, 5, 50);
        wallColors[326][0] = new Color(30, 105, 75);
        wallColors[327][0] = new Color(5, 45, 55);
        wallColors[328][0] = new Color(20, 25, 35);
        wallColors[329][0] = new Color(15, 10, 50);
        wallColors[330][0] = new Color(153, 164, 187);
        wallColors[225][0] = new Color(68, 68, 68);
        wallColors[226][0] = new Color(148, 138, 74);
        wallColors[227][0] = new Color(95, 137, 191);
        wallColors[170][0] = new Color(59, 39, 22);
        wallColors[171][0] = new Color(59, 39, 22);
        color = new Color(52, 52, 52);
        wallColors[1][0] = color;
        wallColors[53][0] = color;
        wallColors[52][0] = color;
        wallColors[51][0] = color;
        wallColors[50][0] = color;
        wallColors[49][0] = color;
        wallColors[48][0] = color;
        wallColors[44][0] = color;
        wallColors[346][0] = color;
        wallColors[5][0] = color;
        color = new Color(88, 61, 46);
        wallColors[2][0] = color;
        wallColors[16][0] = color;
        wallColors[59][0] = color;
        wallColors[3][0] = new Color(61, 58, 78);
        wallColors[4][0] = new Color(73, 51, 36);
        wallColors[6][0] = new Color(91, 30, 30);
        color = new Color(27, 31, 42);
        wallColors[7][0] = color;
        wallColors[17][0] = color;
        wallColors[331][0] = color;
        color = new Color(32, 40, 45);
        wallColors[94][0] = color;
        wallColors[100][0] = color;
        color = new Color(44, 41, 50);
        wallColors[95][0] = color;
        wallColors[101][0] = color;
        color = new Color(31, 39, 26);
        wallColors[8][0] = color;
        wallColors[18][0] = color;
        wallColors[332][0] = color;
        color = new Color(36, 45, 44);
        wallColors[98][0] = color;
        wallColors[104][0] = color;
        color = new Color(38, 49, 50);
        wallColors[99][0] = color;
        wallColors[105][0] = color;
        color = new Color(41, 28, 36);
        wallColors[9][0] = color;
        wallColors[19][0] = color;
        wallColors[333][0] = color;
        color = new Color(72, 50, 77);
        wallColors[96][0] = color;
        wallColors[102][0] = color;
        color = new Color(78, 50, 69);
        wallColors[97][0] = color;
        wallColors[103][0] = color;
        wallColors[10][0] = new Color(74, 62, 12);
        wallColors[334][0] = new Color(74, 62, 12);
        wallColors[11][0] = new Color(46, 56, 59);
        wallColors[335][0] = new Color(46, 56, 59);
        wallColors[12][0] = new Color(75, 32, 11);
        wallColors[336][0] = new Color(75, 32, 11);
        wallColors[13][0] = new Color(67, 37, 37);
        wallColors[338][0] = new Color(67, 37, 37);
        color = new Color(15, 15, 15);
        wallColors[14][0] = color;
        wallColors[337][0] = color;
        wallColors[20][0] = color;
        wallColors[15][0] = new Color(52, 43, 45);
        wallColors[22][0] = new Color(113, 99, 99);
        wallColors[23][0] = new Color(38, 38, 43);
        wallColors[24][0] = new Color(53, 39, 41);
        wallColors[25][0] = new Color(11, 35, 62);
        wallColors[339][0] = new Color(11, 35, 62);
        wallColors[26][0] = new Color(21, 63, 70);
        wallColors[340][0] = new Color(21, 63, 70);
        wallColors[27][0] = new Color(88, 61, 46);
        wallColors[27][1] = new Color(52, 52, 52);
        wallColors[28][0] = new Color(81, 84, 101);
        wallColors[29][0] = new Color(88, 23, 23);
        wallColors[30][0] = new Color(28, 88, 23);
        wallColors[31][0] = new Color(78, 87, 99);
        color = new Color(69, 67, 41);
        wallColors[34][0] = color;
        wallColors[37][0] = color;
        wallColors[32][0] = new Color(86, 17, 40);
        wallColors[33][0] = new Color(49, 47, 83);
        wallColors[35][0] = new Color(51, 51, 70);
        wallColors[36][0] = new Color(87, 59, 55);
        wallColors[38][0] = new Color(49, 57, 49);
        wallColors[39][0] = new Color(78, 79, 73);
        wallColors[45][0] = new Color(60, 59, 51);
        wallColors[46][0] = new Color(48, 57, 47);
        wallColors[47][0] = new Color(71, 77, 85);
        wallColors[40][0] = new Color(85, 102, 103);
        wallColors[41][0] = new Color(52, 50, 62);
        wallColors[42][0] = new Color(71, 42, 44);
        wallColors[43][0] = new Color(73, 66, 50);
        wallColors[54][0] = new Color(40, 56, 50);
        wallColors[55][0] = new Color(49, 48, 36);
        wallColors[56][0] = new Color(43, 33, 32);
        wallColors[57][0] = new Color(31, 40, 49);
        wallColors[58][0] = new Color(48, 35, 52);
        wallColors[60][0] = new Color(1, 52, 20);
        wallColors[61][0] = new Color(55, 39, 26);
        wallColors[62][0] = new Color(39, 33, 26);
        wallColors[69][0] = new Color(43, 42, 68);
        wallColors[70][0] = new Color(30, 70, 80);
        wallColors[341][0] = new Color(100, 40, 1);
        wallColors[342][0] = new Color(92, 30, 72);
        wallColors[343][0] = new Color(42, 81, 1);
        wallColors[344][0] = new Color(1, 81, 109);
        wallColors[345][0] = new Color(56, 22, 97);
        color = new Color(30, 80, 48);
        wallColors[63][0] = color;
        wallColors[65][0] = color;
        wallColors[66][0] = color;
        wallColors[68][0] = color;
        color = new Color(53, 80, 30);
        wallColors[64][0] = color;
        wallColors[67][0] = color;
        wallColors[78][0] = new Color(63, 39, 26);
        wallColors[244][0] = new Color(63, 39, 26);
        wallColors[71][0] = new Color(78, 105, 135);
        wallColors[72][0] = new Color(52, 84, 12);
        wallColors[73][0] = new Color(190, 204, 223);
        color = new Color(64, 62, 80);
        wallColors[74][0] = color;
        wallColors[80][0] = color;
        wallColors[75][0] = new Color(65, 65, 35);
        wallColors[76][0] = new Color(20, 46, 104);
        wallColors[77][0] = new Color(61, 13, 16);
        wallColors[79][0] = new Color(51, 47, 96);
        wallColors[81][0] = new Color(101, 51, 51);
        wallColors[82][0] = new Color(77, 64, 34);
        wallColors[83][0] = new Color(62, 38, 41);
        wallColors[234][0] = new Color(60, 36, 39);
        wallColors[84][0] = new Color(48, 78, 93);
        wallColors[85][0] = new Color(54, 63, 69);
        color = new Color(138, 73, 38);
        wallColors[86][0] = color;
        wallColors[108][0] = color;
        color = new Color(50, 15, 8);
        wallColors[87][0] = color;
        wallColors[112][0] = color;
        wallColors[109][0] = new Color(94, 25, 17);
        wallColors[110][0] = new Color(125, 36, 122);
        wallColors[111][0] = new Color(51, 35, 27);
        wallColors[113][0] = new Color(135, 58, 0);
        wallColors[114][0] = new Color(65, 52, 15);
        wallColors[115][0] = new Color(39, 42, 51);
        wallColors[116][0] = new Color(89, 26, 27);
        wallColors[117][0] = new Color(126, 123, 115);
        wallColors[118][0] = new Color(8, 50, 19);
        wallColors[119][0] = new Color(95, 21, 24);
        wallColors[120][0] = new Color(17, 31, 65);
        wallColors[121][0] = new Color(192, 173, 143);
        wallColors[122][0] = new Color(114, 114, 131);
        wallColors[123][0] = new Color(136, 119, 7);
        wallColors[124][0] = new Color(8, 72, 3);
        wallColors[125][0] = new Color(117, 132, 82);
        wallColors[126][0] = new Color(100, 102, 114);
        wallColors[127][0] = new Color(30, 118, 226);
        wallColors[128][0] = new Color(93, 6, 102);
        wallColors[129][0] = new Color(64, 40, 169);
        wallColors[130][0] = new Color(39, 34, 180);
        wallColors[131][0] = new Color(87, 94, 125);
        wallColors[132][0] = new Color(6, 6, 6);
        wallColors[133][0] = new Color(69, 72, 186);
        wallColors[134][0] = new Color(130, 62, 16);
        wallColors[135][0] = new Color(22, 123, 163);
        wallColors[136][0] = new Color(40, 86, 151);
        wallColors[137][0] = new Color(183, 75, 15);
        wallColors[138][0] = new Color(83, 80, 100);
        wallColors[139][0] = new Color(115, 65, 68);
        wallColors[140][0] = new Color(119, 108, 81);
        wallColors[141][0] = new Color(59, 67, 71);
        wallColors[142][0] = new Color(222, 216, 202);
        wallColors[143][0] = new Color(90, 112, 105);
        wallColors[144][0] = new Color(62, 28, 87);
        wallColors[146][0] = new Color(120, 59, 19);
        wallColors[147][0] = new Color(59, 59, 59);
        wallColors[148][0] = new Color(229, 218, 161);
        wallColors[149][0] = new Color(73, 59, 50);
        wallColors[151][0] = new Color(102, 75, 34);
        wallColors[167][0] = new Color(70, 68, 51);
        let color4 = new Color(125, 100, 100);
        wallColors[316][0] = color4;
        wallColors[317][0] = color4;
        wallColors[172][0] = new Color(163, 96, 0);
        wallColors[242][0] = new Color(5, 5, 5);
        wallColors[243][0] = new Color(5, 5, 5);
        wallColors[173][0] = new Color(94, 163, 46);
        wallColors[174][0] = new Color(117, 32, 59);
        wallColors[175][0] = new Color(20, 11, 203);
        wallColors[176][0] = new Color(74, 69, 88);
        wallColors[177][0] = new Color(60, 30, 30);
        wallColors[183][0] = new Color(111, 117, 135);
        wallColors[179][0] = new Color(111, 117, 135);
        wallColors[178][0] = new Color(111, 117, 135);
        wallColors[184][0] = new Color(25, 23, 54);
        wallColors[181][0] = new Color(25, 23, 54);
        wallColors[180][0] = new Color(25, 23, 54);
        wallColors[182][0] = new Color(74, 71, 129);
        wallColors[185][0] = new Color(52, 52, 52);
        wallColors[186][0] = new Color(38, 9, 66);
        wallColors[216][0] = new Color(158, 100, 64);
        wallColors[217][0] = new Color(62, 45, 75);
        wallColors[218][0] = new Color(57, 14, 12);
        wallColors[219][0] = new Color(96, 72, 133);
        wallColors[187][0] = new Color(149, 80, 51);
        wallColors[235][0] = new Color(140, 75, 48);
        wallColors[220][0] = new Color(67, 55, 80);
        wallColors[221][0] = new Color(64, 37, 29);
        wallColors[222][0] = new Color(70, 51, 91);
        wallColors[188][0] = new Color(82, 63, 80);
        wallColors[189][0] = new Color(65, 61, 77);
        wallColors[190][0] = new Color(64, 65, 92);
        wallColors[191][0] = new Color(76, 53, 84);
        wallColors[192][0] = new Color(144, 67, 52);
        wallColors[193][0] = new Color(149, 48, 48);
        wallColors[194][0] = new Color(111, 32, 36);
        wallColors[195][0] = new Color(147, 48, 55);
        wallColors[196][0] = new Color(97, 67, 51);
        wallColors[197][0] = new Color(112, 80, 62);
        wallColors[198][0] = new Color(88, 61, 46);
        wallColors[199][0] = new Color(127, 94, 76);
        wallColors[200][0] = new Color(143, 50, 123);
        wallColors[201][0] = new Color(136, 120, 131);
        wallColors[202][0] = new Color(219, 92, 143);
        wallColors[203][0] = new Color(113, 64, 150);
        wallColors[204][0] = new Color(74, 67, 60);
        wallColors[205][0] = new Color(60, 78, 59);
        wallColors[206][0] = new Color(0, 54, 21);
        wallColors[207][0] = new Color(74, 97, 72);
        wallColors[208][0] = new Color(40, 37, 35);
        wallColors[209][0] = new Color(77, 63, 66);
        wallColors[210][0] = new Color(111, 6, 6);
        wallColors[211][0] = new Color(88, 67, 59);
        wallColors[212][0] = new Color(88, 87, 80);
        wallColors[213][0] = new Color(71, 71, 67);
        wallColors[214][0] = new Color(76, 52, 60);
        wallColors[215][0] = new Color(89, 48, 59);
        wallColors[223][0] = new Color(51, 18, 4);
        wallColors[228][0] = new Color(160, 2, 75);
        wallColors[229][0] = new Color(100, 55, 164);
        wallColors[230][0] = new Color(0, 117, 101);
        wallColors[236][0] = new Color(127, 49, 44);
        wallColors[231][0] = new Color(110, 90, 78);
        wallColors[232][0] = new Color(47, 69, 75);
        wallColors[233][0] = new Color(91, 67, 70);
        wallColors[237][0] = new Color(200, 44, 18);
        wallColors[238][0] = new Color(24, 93, 66);
        wallColors[239][0] = new Color(160, 87, 234);
        wallColors[240][0] = new Color(6, 106, 255);
        wallColors[245][0] = new Color(102, 102, 102);
        wallColors[315][0] = new Color(181, 230, 29);
        wallColors[246][0] = new Color(61, 58, 78);
        wallColors[247][0] = new Color(52, 43, 45);
        wallColors[248][0] = new Color(81, 84, 101);
        wallColors[249][0] = new Color(85, 102, 103);
        wallColors[250][0] = new Color(52, 52, 52);
        wallColors[251][0] = new Color(52, 52, 52);
        wallColors[252][0] = new Color(52, 52, 52);
        wallColors[253][0] = new Color(52, 52, 52);
        wallColors[254][0] = new Color(52, 52, 52);
        wallColors[255][0] = new Color(52, 52, 52);
        wallColors[314][0] = new Color(52, 52, 52);
        wallColors[256][0] = new Color(40, 56, 50);
        wallColors[257][0] = new Color(49, 48, 36);
        wallColors[258][0] = new Color(43, 33, 32);
        wallColors[259][0] = new Color(31, 40, 49);
        wallColors[260][0] = new Color(48, 35, 52);
        wallColors[261][0] = new Color(88, 61, 46);
        wallColors[262][0] = new Color(55, 39, 26);
        wallColors[263][0] = new Color(39, 33, 26);
        wallColors[264][0] = new Color(43, 42, 68);
        wallColors[265][0] = new Color(30, 70, 80);
        wallColors[266][0] = new Color(78, 105, 135);
        wallColors[267][0] = new Color(51, 47, 96);
        wallColors[268][0] = new Color(101, 51, 51);
        wallColors[269][0] = new Color(62, 38, 41);
        wallColors[270][0] = new Color(59, 39, 22);
        wallColors[271][0] = new Color(59, 39, 22);
        wallColors[272][0] = new Color(111, 117, 135);
        wallColors[273][0] = new Color(25, 23, 54);
        wallColors[274][0] = new Color(52, 52, 52);
        wallColors[275][0] = new Color(149, 80, 51);
        wallColors[276][0] = new Color(82, 63, 80);
        wallColors[277][0] = new Color(65, 61, 77);
        wallColors[278][0] = new Color(64, 65, 92);
        wallColors[279][0] = new Color(76, 53, 84);
        wallColors[280][0] = new Color(144, 67, 52);
        wallColors[281][0] = new Color(149, 48, 48);
        wallColors[282][0] = new Color(111, 32, 36);
        wallColors[283][0] = new Color(147, 48, 55);
        wallColors[284][0] = new Color(97, 67, 51);
        wallColors[285][0] = new Color(112, 80, 62);
        wallColors[286][0] = new Color(88, 61, 46);
        wallColors[287][0] = new Color(127, 94, 76);
        wallColors[288][0] = new Color(143, 50, 123);
        wallColors[289][0] = new Color(136, 120, 131);
        wallColors[290][0] = new Color(219, 92, 143);
        wallColors[291][0] = new Color(113, 64, 150);
        wallColors[292][0] = new Color(74, 67, 60);
        wallColors[293][0] = new Color(60, 78, 59);
        wallColors[294][0] = new Color(0, 54, 21);
        wallColors[295][0] = new Color(74, 97, 72);
        wallColors[296][0] = new Color(40, 37, 35);
        wallColors[297][0] = new Color(77, 63, 66);
        wallColors[298][0] = new Color(111, 6, 6);
        wallColors[299][0] = new Color(88, 67, 59);
        wallColors[300][0] = new Color(88, 87, 80);
        wallColors[301][0] = new Color(71, 71, 67);
        wallColors[302][0] = new Color(76, 52, 60);
        wallColors[303][0] = new Color(89, 48, 59);
        wallColors[304][0] = new Color(158, 100, 64);
        wallColors[305][0] = new Color(62, 45, 75);
        wallColors[306][0] = new Color(57, 14, 12);
        wallColors[307][0] = new Color(96, 72, 133);
        wallColors[308][0] = new Color(67, 55, 80);
        wallColors[309][0] = new Color(64, 37, 29);
        wallColors[310][0] = new Color(70, 51, 91);
        wallColors[311][0] = new Color(51, 18, 4);
        wallColors[312][0] = new Color(78, 110, 51);
        wallColors[313][0] = new Color(78, 110, 51);
        wallColors[319][0] = new Color(105, 51, 108);
        wallColors[320][0] = new Color(75, 30, 15);
        wallColors[321][0] = new Color(91, 108, 130);
        wallColors[322][0] = new Color(91, 108, 130);
        const skyGradient: Color[] = Array(MapHelper.maxSkyGradients);
        let skyColorMin = new Color(50, 40, 255);
        let skyColorMax = new Color(145, 185, 255);
        for (let num6 = 0; num6 < skyGradient.length; num6++) {
            let num7 = num6 / skyGradient.length;
            let num8 = 1 - num7;
            skyGradient[num6] = new Color((skyColorMin.R * num8 + skyColorMax.R * num7), (skyColorMin.G * num8 + skyColorMax.G * num7), (skyColorMin.B * num8 + skyColorMax.B * num7));
        }
        const dirtGradient: Color[] = Array(MapHelper.maxDirtGradients);
        let dirtColorMin = new Color(88, 61, 46);
        let dirtRockColorMax = new Color(37, 78, 123);
        for (let num9 = 0; num9 < dirtGradient.length; num9++) {
            let num10 = num9 / 255;
            let num11 = 1 - num10;
            dirtGradient[num9] = new Color((dirtColorMin.R * num11 + dirtRockColorMax.R * num10), (dirtColorMin.G * num11 + dirtRockColorMax.G * num10), (dirtColorMin.B * num11 + dirtRockColorMax.B * num10));
        }
        const RockGradient: Color[] = Array(MapHelper.maxRockGradients);
        let rockColorMin = new Color(74, 67, 60);
        dirtRockColorMax = new Color(53, 70, 97);
        for (let num12 = 0; num12 < RockGradient.length; num12++) {
            let num13 = num12 / 255;
            let num14 = 1 - num13;
            RockGradient[num12] = new Color((rockColorMin.R * num14 + dirtRockColorMax.R * num13), (rockColorMin.G * num14 + dirtRockColorMax.G * num13), (rockColorMin.B * num14 + dirtRockColorMax.B * num13));
        }
        let color10 = new Color(50, 44, 38);
        let colorCount = 0;
        MapHelper.tileOptionCounts = Array(TileID.Count);
        for (let num16 = 0; num16 < TileID.Count; num16++) {
            let array8 = tileColors[num16];
            let num17;
            for (num17 = 0; num17 < 12 && !(!array8[num17] || (array8[num17] === Color.Transparent)); num17++) {
            }
            MapHelper.tileOptionCounts[num16] = num17;
            colorCount += num17;
        }
        MapHelper.wallOptionCounts = Array(WallID.Count);
        for (let num18 = 0; num18 < WallID.Count; num18++) {
            let array9 = wallColors[num18];
            let num19;
            for (num19 = 0; num19 < 2 && !(!array9[num19] || (array9[num19] === Color.Transparent)); num19++) {
            }
            MapHelper.wallOptionCounts[num18] = num19;
            colorCount += num19;
        }
        colorCount += 774;
        MapHelper.colorLookup = Array(colorCount);
        MapHelper.colorLookup[0] = Color.Transparent;
        let lookupIndex = (MapHelper.tilePosition = 1);
        MapHelper.tileLookup = Array(TileID.Count);
        MapHelper.idLookup = Array(TileID.Count);
        MapHelper.optionLookup = Array(TileID.Count);
        for (let i = 0; i < TileID.Count; i++) {
            if (MapHelper.tileOptionCounts[i] > 0) {
                let _ = tileColors[i];
                MapHelper.tileLookup[i] = lookupIndex;
                for (let j = 0; j < MapHelper.tileOptionCounts[i]; j++) {
                    MapHelper.colorLookup[lookupIndex] = tileColors[i][j];
                    MapHelper.idLookup[lookupIndex] = i;
                    MapHelper.optionLookup[lookupIndex] = j;
                    lookupIndex++;
                }
            }
            else {
                MapHelper.tileLookup[i] = 0;
            }
        }
        MapHelper.wallPosition = lookupIndex;
        MapHelper.wallLookup = Array(WallID.Count);
        MapHelper.wallRangeStart = lookupIndex;
        for (let i = 0; i < WallID.Count; i++) {
            if (MapHelper.wallOptionCounts[i] > 0) {
                let _ = wallColors[i];
                MapHelper.wallLookup[i] = lookupIndex;
                for (let j = 0; j < MapHelper.wallOptionCounts[i]; j++) {
                    MapHelper.colorLookup[lookupIndex] = wallColors[i][j];
                    MapHelper.idLookup[lookupIndex] = i;
                    MapHelper.optionLookup[lookupIndex] = j;
                    lookupIndex++;
                }
            }
            else {
                MapHelper.wallLookup[i] = 0;
            }
        }
        MapHelper.wallRangeEnd = lookupIndex;
        MapHelper.liquidPosition = lookupIndex;
        for (let i = 0; i < 4; i++) {
            MapHelper.colorLookup[lookupIndex] = liquidColors[i];
            MapHelper.idLookup[lookupIndex] = i;
            lookupIndex++;
        }
        MapHelper.skyPosition = lookupIndex;
        for (let i = 0; i < 256; i++) {
            MapHelper.colorLookup[lookupIndex] = skyGradient[i];
            lookupIndex++;
        }
        MapHelper.dirtPosition = lookupIndex;
        for (let i = 0; i < 256; i++) {
            MapHelper.colorLookup[lookupIndex] = dirtGradient[i];
            lookupIndex++;
        }
        MapHelper.rockPosition = lookupIndex;
        for (let i = 0; i < 256; i++) {
            MapHelper.colorLookup[lookupIndex] = RockGradient[i];
            lookupIndex++;
        }
        MapHelper.hellPosition = lookupIndex;
        MapHelper.colorLookup[lookupIndex] = color10;
        MapHelper.snowTypes = Array(6);
        MapHelper.snowTypes[0] = MapHelper.tileLookup[147];
        MapHelper.snowTypes[1] = MapHelper.tileLookup[161];
        MapHelper.snowTypes[2] = MapHelper.tileLookup[162];
        MapHelper.snowTypes[3] = MapHelper.tileLookup[163];
        MapHelper.snowTypes[4] = MapHelper.tileLookup[164];
        MapHelper.snowTypes[5] = MapHelper.tileLookup[200];
    }

    public static paintColor(color: number) {
        const white = Color.White;
        if (color == 1 || color == 13) {
            white.R = 255;
            white.G = 0;
            white.B = 0;
        }
        if (color == 2 || color == 14) {
            white.R = 255;
            white.G = 127;
            white.B = 0;
        }
        if (color == 3 || color == 15) {
            white.R = 255;
            white.G = 255;
            white.B = 0;
        }
        if (color == 4 || color == 16) {
            white.R = 127;
            white.G = 255;
            white.B = 0;
        }
        if (color == 5 || color == 17) {
            white.R = 0;
            white.G = 255;
            white.B = 0;
        }
        if (color == 6 || color == 18) {
            white.R = 0;
            white.G = 255;
            white.B = 127;
        }
        if (color == 7 || color == 19) {
            white.R = 0;
            white.G = 255;
            white.B = 255;
        }
        if (color == 8 || color == 20) {
            white.R = 0;
            white.G = 127;
            white.B = 255;
        }
        if (color == 9 || color == 21) {
            white.R = 0;
            white.G = 0;
            white.B = 255;
        }
        if (color == 10 || color == 22) {
            white.R = 127;
            white.G = 0;
            white.B = 255;
        }
        if (color == 11 || color == 23) {
            white.R = 255;
            white.G = 0;
            white.B = 255;
        }
        if (color == 12 || color == 24) {
            white.R = 255;
            white.G = 0;
            white.B = 127;
        }
        if (color == 25) {
            white.R = 75;
            white.G = 75;
            white.B = 75;
        }
        if (color == 26) {
            white.R = 255;
            white.G = 255;
            white.B = 255;
        }
        if (color == 27) {
            white.R = 175;
            white.G = 175;
            white.B = 175;
        }
        if (color == 28) {
            white.R = 255;
            white.G = 178;
            white.B = 125;
        }
        if (color == 29) {
            white.R = 25;
            white.G = 25;
            white.B = 25;
        }
        if (color == 30) {
            white.R = 200;
            white.G = 200;
            white.B = 200;
            white.A = 150;
        }
        return white;
    }

    public static MapColor(type: number, oldColor: Color, colorType: number) {
        const color = MapHelper.paintColor(colorType);
        let max = oldColor.R / 255;
        let mid = oldColor.G / 255;
        let min = oldColor.B / 255;
        if (mid > max) {
            let swap = max;
            max = mid;
            mid = swap;
        }
        if (min > max) {
            let swap = max;
            max = min;
            min = swap;
        }
        switch (colorType) {
            case 29:
                const num7 = min * 0.3;
                oldColor.R = color.R * num7;
                oldColor.G = color.G * num7;
                oldColor.B = color.B * num7;
                break;
            case 30:
                if (type >= MapHelper.wallRangeStart && type <= MapHelper.wallRangeEnd) {
                    oldColor.R = (255 - oldColor.R) * 0.5;
                    oldColor.G = (255 - oldColor.G) * 0.5;
                    oldColor.B = (255 - oldColor.B) * 0.5;
                }
                else {
                    oldColor.R = 255 - oldColor.R;
                    oldColor.G = 255 - oldColor.G;
                    oldColor.B = 255 - oldColor.B;
                }
                break;
            default:
                const num6 = max;
                oldColor.R = color.R * num6;
                oldColor.G = color.G * num6;
                oldColor.B = color.B * num6;
                break;
        }
    }

    public static GetMapTileXnaColor(tile: MapTile) {
        return MapHelper.colorLookup[tile.Type] || Color.globalBlack;
    }

    public static GetMapAirTile(y: number, worldSurface: number) {
        if (y < worldSurface) {
            let depth = Math.floor(MapHelper.maxSkyGradients * (y / worldSurface));
            return depth + MapHelper.skyPosition;
        }
        else {
            return MapHelper.hellPosition;
        }
    }

    public static EstimateWorldSurface(worldHeight: number) {
        return Math.round(0.2 * worldHeight + 75);
    }
    public static EstimateRockLayer(worldHeight: number) {
        return Math.round(0.35 * worldHeight + 25);
    }
    public static EstimateUnderworldLayer(worldHeight: number) {
        return Math.round(0.9 * worldHeight - 125);
    }


    public static getFrameFromBaseOption(tileType: number, baseOption: number) {
        const tileCache = {
            frameX: 0,
            frameY: 0
        };
        switch (tileType) {
            case TileID.Benches:
                {
                    let n: number;
                    switch (baseOption) {
                        case 0:
                            n = 0; // 21, 23
                            break;
                        case 2:
                            n = 43;
                            break;
                        case 1:
                        default:
                            n = 1; // ?
                            break;
                    }
                    tileCache.frameX = n * 54;
                    break;
                }
            case TileID.RainbowBrick:
            case TileID.RainbowMoss:
            case TileID.RainbowMossBrick:
            case TileID.RainbowMossBlock:
                // position dependent
                break;
            case TileID.SandDrip:
            case TileID.Cactus:
            case TileID.SeaOats:
            case TileID.OasisPlants:
                // base option stores corrupt/crimsoned/hallowed
                break;
            case TileID.Platforms:
                if (baseOption === 1) {
                    tileCache.frameY = 48 * 18;
                }
                break;
            case TileID.Chairs:
                if (baseOption === 1) {
                    tileCache.frameY = 1 * 40; // 20
                }
                break;
            case TileID.LilyPad:
            case TileID.Cattail:
                tileCache.frameY = baseOption * 18;
                break;
            case TileID.Torches:
                if (baseOption === 1) {
                    tileCache.frameX = 66;
                }
                break;
            case TileID.SoulBottles:
                tileCache.frameY = baseOption * 36;
                break;
            case TileID.Containers:
            case TileID.FakeContainers:
                {
                    let n: number;
                    switch (baseOption) {
                        case 1:
                            n = 1; // 2, 10, 13, 15
                            break;
                        case 2:
                            n = 3; // 4
                            break;
                        case 3:
                            n = 6;
                            break;
                        case 4:
                            n = 11; // 17
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = n * 36;
                    break;
                }
            case TileID.Containers2:
            case TileID.FakeContainers2:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.GolfTrophies:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.Pots:
            case TileID.PotsEcho:
                tileCache.frameY = baseOption * 108;
                break;
            case TileID.Sunflower:
                // just the head of the flower
                break;
            case TileID.ShadowOrbs:
                if (baseOption === 1) {
                    tileCache.frameX = 36;
                }
                break;
            case TileID.DemonAltar:
                if (baseOption === 1) {
                    tileCache.frameX = 54;
                }
                break;
            case TileID.Traps:
                {
                    let n: number;
                    switch (baseOption) {
                        case 1:
                            n = 1; // 2, 3, 4
                        case 2:
                            n = 5;
                        default:
                            n = 0;
                    }
                    tileCache.frameY = n * 18;
                    break;
                }
            case TileID.ImmatureHerbs:
            case TileID.MatureHerbs:
            case TileID.BloomingHerbs:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.PotsSuspended:
                tileCache.frameX = baseOption * 36;
                break;
            case TileID.Statues:
                switch (baseOption) {
                    case 1:
                        tileCache.frameX = 1548;
                        break;
                    case 2:
                        tileCache.frameX = 1656;
                        break;
                    default:
                        tileCache.frameX = 0;
                        break;
                }
                break;
            case TileID.AdamantiteForge:
                if (baseOption === 1) {
                    tileCache.frameX = 52;
                }
                break;
            case TileID.MythrilAnvil:
                if (baseOption === 1) {
                    tileCache.frameX = 28;
                }
                break;
            case TileID.HolidayLights:
                // position dependent
                break;
            case TileID.Stalactite:
                tileCache.frameX = baseOption * 52;
                break;
            case TileID.ExposedGems:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.LongMoss:
                tileCache.frameX = baseOption * 22;
                break;
            case TileID.SmallPiles1x1Echo:
            case TileID.SmallPiles: // can also do one below but not determinable from just baseOption
                {
                    let n: number;
                    switch (baseOption) {
                        case 0:
                            n = 0; // 0~5, 19, 20, 21, 22, 23, 24, 33, 38, 39, 40, 41~58
                            break;
                        case 2:
                            n = 6; // 6~15, 59~61
                            break;
                        case 1:
                            n = 16; // 16~18, 31, 32
                            break;
                        case 3:
                            n = 25; // 25~30
                            break;
                        case 4:
                            n = 34; // 34~37
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = (n % 18) * 36;
                    tileCache.frameY = Math.floor(n / 18) + 1 * 18;
                    break;
                }
            case TileID.SmallPiles2x1Echo:
                {
                    let n: number;
                    switch (baseOption) {
                        case 0:
                            n = 0; // 0~5, 28, 29, 30, 31, 32, 54~71
                            break;
                        case 1:
                            n = 6; // 6~11, 33, 34, 35, 72
                            break;
                        case 2:
                            n = 12; // 12~27
                            break;
                        case 3:
                            n = 36; // 36~47
                            break;
                        case 4:
                            n = 48; // 48~53
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = n * 18;
                    break;
                }
            case TileID.LargePiles:
            case TileID.LargePilesEcho:
                {
                    let n: number;
                    switch (baseOption) {
                        case 2:
                            n = 0; // 0~6
                            break;
                        case 0:
                            n = 7; // 7~21, 33, 34, 35
                            break;
                        case 1:
                            n = 22; // 22~24
                            break;
                        case 5:
                            n = 25; // 25
                            break;
                        case 3:
                            n = 26; // 26~31
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = n * 54;
                    break;
                }
            case TileID.LargePiles2:
            case TileID.LargePiles2Echo:
                {
                    let n: number;
                    switch (baseOption) {
                        case 0:
                            n = 0; // 0~2, 14, 15, 16, 23~24, 29~46
                            break;
                        case 6:
                            n = 3; // 3~5
                            break;
                        case 7:
                            n = 6; // 6~8
                            break;
                        case 4:
                            n = 9; // 9~13, 17
                            break;
                        case 8:
                            n = 18; // 18~22
                            break;
                        case 1:
                            n = 25; // 25~28, 47~49
                            break;
                        case 10:
                            n = 50; // 50~51
                            break;
                        case 2:
                            n = 52; // 52~55
                            break;
                        default:
                            n = 0;
                            break;
                    } // 3, 5, 9 skipped?
                    tileCache.frameX = (n % 36) * 54;
                    tileCache.frameY = Math.floor(n / 36) * 36;
                    break;
                }
            case TileID.DyePlants:
                tileCache.frameX = baseOption * 34;
                break;
            case TileID.Crystals:
                if (baseOption === 1) {
                    tileCache.frameX = 324;
                }
                break;
            case TileID.Painting3X3:
                {
                    let n: number;
                    switch (baseOption) {
                        case 0:
                            n = 0;
                            break;
                        case 1:
                            n = 12;
                            break;
                        case 2:
                            n = 16;
                            break;
                        case 3:
                            n = 41;
                            break;
                        case 4:
                            n = 46;
                            break;
                        default:
                            n = 0;
                            break;
                    }
                    tileCache.frameX = (n % 36) * 54;
                    tileCache.frameY = Math.floor(n / 36) * 54;
                    break;
                }
            case TileID.Painting6X4:
                {
                    let n: number;
                    if (baseOption === 1) {
                        n = 22;
                    } else {
                        n = 0;
                    }
                    tileCache.frameY = n * 72;
                    break;
                }
            case TileID.GemLocks:
                tileCache.frameX = baseOption * 54;
                break;
            case TileID.PartyPresent:
            case TileID.SillyBalloonTile:
                tileCache.frameX * baseOption * 36;
                break;
            case TileID.LogicGateLamp:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.WeightedPressurePlate:
            case TileID.LogicGate:
            case TileID.LogicSensor:
                tileCache.frameY = baseOption * 18;
                break;
            case TileID.GolfCupFlag:
                tileCache.frameX = baseOption * 18;
                break;
            case TileID.PottedPlants2:
                if (baseOption === 1) {
                    tileCache.frameX = 8 * 54
                }
                break;
            case TileID.TeleportationPylon:
                tileCache.frameX = baseOption * 54;
                break;
        }
        return tileCache;
    }

    public static async Load(fileIO: BinaryReader, worldMap: WorldMap) {
        const release = fileIO.ReadInt32();
        if (release <= 91) {
            MapHelper.LoadMapVersion1(fileIO, release, worldMap);
        } else {
            await MapHelper.LoadMapVersion2(fileIO, release, worldMap);
        }
    }

    static ReadFileMetadata(fileIO: BinaryReader) {
        const metadata: FileMetadata = {};
        metadata.magicNumber = fileIO.ReadString(7);
        if (metadata.magicNumber !== "relogic") {
            if (metadata.magicNumber === "xindong") {
                metadata.isChinese = true;
            } else {
                throw new TypeError(`Bad file: missing relogic header, not terraria file`);
            }
        }
        metadata.fileType = fileIO.ReadByte();
        if (metadata.fileType !== FileType.Map) {
            throw new TypeError(`Bad file: is terraria file, but not .map file`);
        }
        metadata.revision = Number(fileIO.ReadUInt32());
        const someBitfield = fileIO.ReadUInt64();
        metadata.favorite = !!(someBitfield & 1n);
        return metadata;
    }

    static LoadMapVersion1(fileIO: BinaryReader, release: number, worldMap: WorldMap) {
        const worldName = fileIO.ReadString();
        const worldId = fileIO.ReadInt32();
        const worldHeight = fileIO.ReadInt32();
        const worldWidth = fileIO.ReadInt32();

        const worldSurface = MapHelper.EstimateWorldSurface(worldHeight);
        const rockLayer = MapHelper.EstimateRockLayer(worldHeight);
        const underworldLayer = MapHelper.EstimateUnderworldLayer(worldHeight);

        worldMap.setDimensions(worldWidth, worldHeight);
        worldMap.worldName = worldName;
        worldMap.worldId = worldId;
        worldMap.release = release;
        worldMap.revision = -1;
        worldMap.isChinese = false;
        worldMap.rockLayer = rockLayer;
        worldMap.worldSurface = worldSurface;
        worldMap.worldSurfaceEstimated = true;

        const oldMapHelper = new OldMapHelper();
        for (let x = 0; x < worldWidth; x++) {
            for (let y = 0; y < worldHeight; y++) {
                if (fileIO.ReadBoolean()) {
                    let tileGroupIndex = ((release <= 77) ? fileIO.ReadByte() : fileIO.ReadUInt16());
                    let light = fileIO.ReadByte();
                    oldMapHelper.misc = fileIO.ReadByte();
                    if (release >= 50) {
                        oldMapHelper.misc2 = fileIO.ReadByte();
                    }
                    else {
                        oldMapHelper.misc2 = 0;
                    }
                    let isGradientType = false;
                    const option = oldMapHelper.option();
                    let tileType: number;
                    let tileGroup: TileGroup;
                    if (oldMapHelper.active()) {
                        tileGroup = TileGroup.Tile;
                        tileType = option + MapHelper.tileLookup[tileGroupIndex];
                    }
                    else if (oldMapHelper.water()) {
                        tileGroup = TileGroup.Water;
                        tileType = MapHelper.liquidPosition;
                    }
                    else if (oldMapHelper.lava()) {
                        tileGroup = TileGroup.Lava;
                        tileType = MapHelper.liquidPosition + 1;
                    }
                    else if (oldMapHelper.honey()) {
                        tileGroup = TileGroup.Honey;
                        tileType = MapHelper.liquidPosition + 2;
                    }
                    else if (oldMapHelper.wall()) {
                        tileGroup = TileGroup.Wall;
                        tileType = option + MapHelper.wallLookup[tileGroupIndex];
                    }
                    else if (y < worldSurface) {
                        tileGroup = TileGroup.Air;
                        isGradientType = true;
                        tileType = MapHelper.skyPosition;
                    }
                    else if (y < rockLayer) {
                        tileGroup = TileGroup.DirtRock;
                        isGradientType = true;
                        if (tileGroupIndex > 255) {
                            tileGroupIndex = 255;
                        }
                        tileType = tileGroupIndex + MapHelper.dirtPosition;
                    }
                    else if (y < underworldLayer) {
                        tileGroup = TileGroup.DirtRock;
                        isGradientType = true;
                        if (tileGroupIndex > 255) {
                            tileGroupIndex = 255;
                        }
                        tileType = tileGroupIndex + MapHelper.rockPosition;
                    }
                    else {
                        tileGroup = TileGroup.Air;
                        tileType = MapHelper.hellPosition;
                    }
                    let tile = MapTile.Create(tileType, light, 0, tileGroup, MapHelper.idLookup[tileType], MapHelper.optionLookup[tileType]);
                    let repeated = fileIO.ReadInt16();

                    if (light === 255) {
                        while (repeated > 0) {
                            repeated--;
                            y++;
                            if (isGradientType) {
                                if (y < worldSurface) {
                                    tileGroup = TileGroup.Air;
                                    tileType = MapHelper.skyPosition;
                                }
                                else if (y < rockLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + MapHelper.dirtPosition;
                                }
                                else if (y < underworldLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + MapHelper.rockPosition;
                                }
                                else {
                                    tileGroup = TileGroup.Air;
                                    tileType = MapHelper.hellPosition;
                                }
                                tile = MapTile.Create(tileType, light, 0, tileGroup, MapHelper.idLookup[tileType], MapHelper.optionLookup[tileType]);
                            }

                            worldMap.SetTile(x, y, tile);
                        }
                    } else {
                        while (repeated > 0) {
                            y++;
                            repeated--;
                            light = fileIO.ReadByte();
                            if (light <= 18) {
                                continue;
                            }
                            if (isGradientType) {
                                if (y < worldSurface) {
                                    tileGroup = TileGroup.Air;
                                    tileType = MapHelper.skyPosition;
                                }
                                else if (y < rockLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + MapHelper.dirtPosition;
                                }
                                else if (y < underworldLayer) {
                                    tileGroup = TileGroup.DirtRock;
                                    tileType = tileGroupIndex + MapHelper.rockPosition;
                                }
                                else {
                                    tileGroup = TileGroup.Air;
                                    tileType = MapHelper.hellPosition;
                                }
                                tile = MapTile.Create(tileType, light, 0, tileGroup, MapHelper.idLookup[tileType], MapHelper.optionLookup[tileType]);
                            } else {
                                tile = tile.WithLight(light);
                            }
                            worldMap.SetTile(x, y, tile);
                        }
                    }
                }
                else {
                    const repeated = fileIO.ReadInt16();
                    y += repeated;
                }
            }
        }
    }



    static async LoadMapVersion2(fileIO: BinaryReader, release: number, worldMap: WorldMap) {
        const metadata = release > 135 ? MapHelper.ReadFileMetadata(fileIO) : null;
        const worldName = fileIO.ReadString();
        const worldId = fileIO.ReadInt32();
        const worldHeight = fileIO.ReadInt32();
        const worldWidth = fileIO.ReadInt32();

        const rockLayer = MapHelper.EstimateRockLayer(worldHeight);

        worldMap.setDimensions(worldWidth, worldHeight);
        worldMap.worldName = worldName;
        worldMap.worldId = worldId;
        worldMap.release = release;
        worldMap.revision = metadata ? metadata.revision! : -1;
        worldMap.isChinese = metadata ? metadata.isChinese! : false;
        worldMap.rockLayer = rockLayer;
        worldMap.worldSurface = -1;

        const tileCount = fileIO.ReadInt16();
        const wallCount = fileIO.ReadInt16();
        const liquidCount = fileIO.ReadInt16();
        const airCount = fileIO.ReadInt16();
        const dirtCount = fileIO.ReadInt16();
        const rockCount = fileIO.ReadInt16();
        const tileHasOptions = fileIO.ReadBitArray(tileCount);
        const wallHasOptions = fileIO.ReadBitArray(wallCount);
        const tileOptionCounts = new Uint8Array(tileCount);
        let tileTotal = 0;
        for (let i = 0; i < tileCount; ++i) {
            tileOptionCounts[i] = !tileHasOptions[i] ? 1 : fileIO.ReadByte();
            tileTotal += tileOptionCounts[i];
        }
        const wallOptionCounts = new Uint8Array(wallCount);
        let wallTotal = 0;
        for (let i = 0; i < wallCount; ++i) {
            wallOptionCounts[i] = !wallHasOptions[i] ? 1 : fileIO.ReadByte();
            wallTotal += wallOptionCounts[i];
        }
        const tileTypes = new Uint16Array(tileTotal + wallTotal + liquidCount + airCount + dirtCount + rockCount + 2);
        tileTypes[0] = 0;
        let indexLatest = 1;
        let index = 1;
        const tileOffset = index;
        for (let i = 0; i < TileID.Count; ++i) {
            if (i < tileCount) {
                const tileOptions = tileOptionCounts[i];
                const tileOptionsLatest = MapHelper.tileOptionCounts[i];
                for (let j = 0; j < tileOptionsLatest; ++j) {
                    if (j < tileOptions) {
                        tileTypes[index] = indexLatest;
                        ++index;
                    }
                    ++indexLatest;
                }
            }
            else {
                indexLatest += MapHelper.tileOptionCounts[i];
            }
        }
        const wallOffset = index;
        for (let i = 0; i < WallID.Count; ++i) {
            if (i < wallCount) {
                const wallOptions = wallOptionCounts[i];
                const wallOptionsLatest = MapHelper.wallOptionCounts[i];
                for (let j = 0; j < wallOptionsLatest; ++j) {
                    if (j < wallOptions) {
                        tileTypes[index] = indexLatest;
                        ++index;
                    }
                    ++indexLatest;
                }
            }
            else
                indexLatest += MapHelper.wallOptionCounts[i];
        }
        const liquidOffset = index;
        for (let i = 0; i < MapHelper.maxLiquidTypes; ++i) {
            if (i < liquidCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const airOffset = index;
        for (let i = 0; i < MapHelper.maxSkyGradients; ++i) {
            if (i < airCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const dirtOffset = index;
        for (let i = 0; i < MapHelper.maxDirtGradients; ++i) {
            if (i < dirtCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        const rockOffset = index;
        for (let i = 0; i < MapHelper.maxRockGradients; ++i) {
            if (i < rockCount) {
                tileTypes[index] = indexLatest;
                ++index;
            }
            ++indexLatest;
        }
        //const hellOffset = mapTileIndex;
        tileTypes[index] = indexLatest;
        const deflatedFileIO = release < 93 ? fileIO : new BinaryReader(await global.decompressBuffer(fileIO.data.buffer.slice(fileIO.pos) as ArrayBuffer, "deflate-raw"));
        for (let y = 0; y < worldHeight; ++y) {
            for (let x = 0; x < worldWidth; ++x) {
                const tileFlags = deflatedFileIO.ReadByte(); // VVWZYYYX
                // X - has color
                // YYY - tile group
                // Z - tile type index width
                // W - has light level
                // V - has repeated and repeated width
                const tileColor = (tileFlags & 0b0000_0001) != 1 ? 0 : deflatedFileIO.ReadByte();
                const tileGroup = (tileFlags & 0b0000_1110) >> 1;
                let hasTileType: boolean;
                switch (tileGroup) {
                    case TileGroup.Empty:
                        hasTileType = false;
                        break;
                    case TileGroup.Tile:
                    case TileGroup.Wall:
                    case TileGroup.DirtRock:
                        hasTileType = true;
                        break;
                    case TileGroup.Water:
                    case TileGroup.Lava:
                    case TileGroup.Honey:
                        hasTileType = false;
                        break;
                    case TileGroup.Air:
                        hasTileType = false;
                        break;
                    default:
                        hasTileType = false;
                        break;
                }
                let tileType = !hasTileType ? 0 : ((tileFlags & 0b0001_0000) !== 0b0001_0000 ? deflatedFileIO.ReadByte() : deflatedFileIO.ReadUInt16());
                const light = (tileFlags & 0b0010_0000) !== 0b0010_0000 ? 255 : deflatedFileIO.ReadByte();
                let repeated;
                switch (((tileFlags & 0b1100_0000) >> 6)) {
                    case 0:
                        repeated = 0;
                        break;
                    case 1:
                        repeated = deflatedFileIO.ReadByte();
                        break;
                    case 2:
                        repeated = deflatedFileIO.ReadInt16();
                        break;
                    default:
                        repeated = 0;
                        break;
                }
                switch (tileGroup) {
                    case TileGroup.Empty:
                        x += repeated;
                        continue;
                    case TileGroup.Tile:
                        tileType += tileOffset;
                        break;
                    case TileGroup.Wall:
                        tileType += wallOffset;
                        break;
                    case TileGroup.Water:
                    case TileGroup.Lava:
                    case TileGroup.Honey:
                        let whichLiquid = tileGroup - 3;
                        if ((tileColor & 0x40) == 0x40) { // shimmer
                            whichLiquid = 3;
                        }
                        tileType += liquidOffset + whichLiquid;
                        break;
                    case TileGroup.Air:
                        tileType = airOffset;
                        break;
                    case TileGroup.DirtRock:
                        if (worldMap.worldSurface === -1) {
                            worldMap.worldSurface = y;
                        }
                        if (y < rockLayer) {
                            tileType += dirtOffset;
                            break;
                        }
                        else {
                            tileType += rockOffset;
                            break;
                        }
                }

                const tileTypeLatest = tileTypes[tileType];
                let tile: MapTile = MapTile.Create(tileTypeLatest, light, tileColor >> 1 & 31, tileGroup, MapHelper.idLookup[tileTypeLatest], MapHelper.optionLookup[tileTypeLatest]);
                worldMap.SetTile(x, y, tile);

                if (light === 255) {
                    while (repeated > 0) {
                        x++;
                        worldMap.SetTile(x, y, tile);
                        repeated--;
                    }
                } else {
                    while (repeated > 0) {
                        x++;
                        tile = tile.WithLight(deflatedFileIO.ReadByte());
                        worldMap.SetTile(x, y, tile);
                        repeated--;
                    }
                }
            }
        }
        if (worldMap.worldSurface === -1) {
            worldMap.worldSurface = MapHelper.EstimateWorldSurface(worldHeight);
            worldMap.worldSurfaceEstimated = true;
        } else {
            worldMap.worldSurfaceEstimated = false;
        }
    }

    static WriteSchematic(bw: BinaryWriter, worldMap: WorldMap) {
        bw.WriteString(worldMap.worldName!);
        bw.WriteInt32(MapHelper.lastestRelease + 10000);
        bw.WriteBitArray(TileData.frameImportant);
        bw.WriteInt32(worldMap.width);
        bw.WriteInt32(worldMap.height);

        this.WriteTiles(bw, worldMap);

        // chests
        bw.WriteInt16(0); // count 
        bw.WriteInt16(0); // max chest contents

        // signs
        bw.WriteInt16(0); // count

        // entities
        bw.WriteInt32(0); // count

        bw.WriteString(worldMap.worldName!);
        bw.WriteInt32(MapHelper.lastestRelease);
        bw.WriteInt32(worldMap.width);
        bw.WriteInt32(worldMap.height);
    }

    static WriteTiles(bw: BinaryWriter, worldMap: WorldMap) {
        const u: number[] = [];
        const v: number[] = [];
        let lastWall = MapTile.anyWall;

        for (let x = 0; x < worldMap.width; x++) {
            for (let y = 0; y < worldMap.height; y++) {
                const i = y * worldMap.width + x;
                const tile = worldMap.tiles[i] || MapTile.ShadowDirt;
                let needsWall = false;
                if (tile !== MapTile.ShadowDirt) {
                    if (tile.Group === TileGroup.Tile && TileData.frameImportant[tile.ID!]) {
                        MapHelper.getTileUV(worldMap, tile, x, y, u, v);
                        if (tile.ID! === TileID.Torches) {
                            needsWall = MapHelper.needsWall(worldMap, x, y);
                        }
                    } else if (tile.Group === TileGroup.Wall) {
                        lastWall = tile;
                    }
                }

                const res = MapHelper.SerializeTileData(tile, u[i], v[i], needsWall, lastWall);
                const { tileData } = res;
                let { headerIndex, dataIndex } = res;

                let header1 = tileData[headerIndex];

                let rle = 0;
                if (tile.ID !== 520 && tile.ID !== 423) {
                    let y2 = y + 1;
                    let i2 = y2 * worldMap.width + x;
                    while (y2 < worldMap.height && tile.EqualsAfterExport(worldMap.tile(x, y2) || MapTile.ShadowDirt) && (tile.Group !== TileGroup.Tile || !TileData.frameImportant[tile.ID!] || (u[i] === u[y2 * worldMap.width + x] && v[i] === v[y2 * worldMap.width + x]))) {
                        rle++;
                        y2++;
                        i2 = y2 * worldMap.width + x;
                    }
                }
                y += rle;

                if (rle > 0) {
                    tileData[dataIndex++] = rle & 0xFF;
                    if (rle <= 255) {
                        header1 |= 0b0100_0000;
                    } else {
                        tileData[dataIndex++] = rle >> 8;
                        header1 |= 0b1000_0000;
                    }
                    tileData[headerIndex] = header1;
                }

                bw.WriteUint8Array(tileData, headerIndex, dataIndex - headerIndex);
            }
        }
    }

    static SerializeTileData(tile: MapTile, u: number | undefined, v: number | undefined, needsWall: boolean, wall: MapTile) {
        const tileData = new Uint8Array(16);
        let dataIndex = 4;

        let header3 = 0;
        let header2 = 0;
        let header1 = 0;
        if (tile.Group === TileGroup.Tile) {
            header1 |= 0b0000_0010;
            tileData[dataIndex++] = tile.ID! & 0xFF;
            if (tile.ID! > 255) {
                header1 |= 0b0010_0000;
                tileData[dataIndex++] = tile.ID! >> 8;
            }

            if (TileData.frameImportant[tile.ID!]) {
                tileData[dataIndex++] = (u! & 0xFF); // low byte
                tileData[dataIndex++] = ((u! & 0xFF00) >> 8); // high byte
                tileData[dataIndex++] = (v! & 0xFF); // low byte
                tileData[dataIndex++] = ((v! & 0xFF00) >> 8); // high byte
            }

            if (tile.Color !== 0) {
                header3 |= 0b0000_1000;
                tileData[dataIndex++] = tile.Color;
            }

            if (needsWall) {
                header1 |= 0b0000_0100;
                tileData[dataIndex++] = wall.ID! & 0xFF;

                if (wall.Color !== 0) {
                    header3 |= 0b0001_0000;
                    tileData[dataIndex++] = wall.Color;
                }
            }
        } else if (tile.Group === TileGroup.Wall) {
            header1 |= 0b0000_0100;
            tileData[dataIndex++] = tile.ID! & 0xFF;

            if (tile.Color !== 0) {
                header3 |= 0b0001_0000;
                tileData[dataIndex++] = tile.Color;
            }
        } else if (tile.Group >= TileGroup.Water && tile.Group <= TileGroup.Honey) {
            if (tile.Group === TileGroup.Water) {
                header1 |= 0b0000_1000;
                if (tile.ID === 3) { // shimmer
                    header3 |= 0b1000_0000;
                }
            } else if (tile.Group === TileGroup.Lava) {
                header1 |= 0b0001_0000;
            } else { // honey
                header1 |= 0b0001_1000;
            }
            tileData[dataIndex++] = 255;
        }

        let headerIndex = 3;
        if (header3 !== 0) {
            header2 |= 0b0000_0001;
            tileData[headerIndex--] = header3;
        }
        if (header2 !== 0) {
            header1 |= 0b0000_0001;
            tileData[headerIndex--] = header2;
        }
        tileData[headerIndex] = header1;
        return { tileData, headerIndex, dataIndex };
    }

    static getTileUV(worldMap: WorldMap, tile: MapTile, x: number, y: number, u: number[], v: number[]) {
        const i = y * worldMap.width + x;
        if (TileData.tree[tile.ID!]) {
            MapHelper.resolveTree(worldMap, x, y, u, v);
        } else if (tile.ID! === TileID.Stalactite) {
            MapHelper.resolveStalactite(worldMap, x, y, v);
        } else if (tile.ID! === TileID.PlantDetritus) {
            MapHelper.resolvePlantDetritus(worldMap, x, y, u, v);
        } else {
            MapHelper.resolveWidth(worldMap, x, y, u);
            MapHelper.resolveHeight(worldMap, x, y, v);
        }
        const { frameX, frameY } = MapHelper.getFrameFromBaseOption(tile.ID!, tile.Option!);
        u[i] = (u[i] || 0) + frameX;
        v[i] = (v[i] || 0) + frameY;
    }

    static resolveWidth(worldMap: WorldMap, x: number, y: number, u: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.tiles[i];
        if (tile.ID! in TileData.width) {
            if (x === 0) {
                u[i] = 0;
            } else {
                const i2 = y * worldMap.width + x - 1;
                const tileR = worldMap.tiles[i2];
                if (tileR && tileR.ID! === tile.ID) {
                    u[i] = (u[i2] + 18) % (18 * TileData.width[tile.ID]);
                } else {
                    u[i] = 0;
                }
            }
        }
    }

    static resolveHeight(worldMap: WorldMap, x: number, y: number, v: number[]) {
        const i = y * worldMap.width + x;
        const tile = worldMap.tiles[i];
        if (tile.ID! in TileData.height) {
            if (y === 0) {
                v[i] = 0;
            } else {
                const i2 = (y - 1) * worldMap.width + x;
                const tileU = worldMap.tiles[i2];
                if (tileU && tileU.ID! === tile.ID) {
                    v[i] = (v[i2] + 18) % (18 * TileData.height[tile.ID]);
                } else {
                    v[i] = 0;
                }
            }
        }
    }

    static resolveTree(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        if (u[i] !== undefined) {
            return;
        }

        // find top of tree
        let tolerance = 2;
        while (tolerance > 0 && y > 0) {
            if (MapHelper.treeAt(worldMap, x, y - 1)) {
                y--;
                tolerance = 2;
                continue;
            }
            if (x > 0 && MapHelper.treeAt(worldMap, x - 1, y)) {
                x--;
                tolerance--;
                continue;
            }
            if (x < worldMap.width - 1 && MapHelper.treeAt(worldMap, x + 1, y)) {
                x++;
                tolerance--;
                continue;
            }
            break;
        }

        i = y * worldMap.width + x;
        u[i] = TileData.treeBaseTop[0];
        v[i] = TileData.treeBaseTop[1];

        // descend tree
        y++;
        for (; MapHelper.treeAt(worldMap, x, y + 1); y++) {
            i = y * worldMap.width + x;
            let left = false;
            let right = false;
            if (x > 0 && MapHelper.treeAt(worldMap, x - 1, y)) {
                left = true;
                const i2 = i - 1;
                if (y % 2 === 0) {
                    u[i2] = TileData.treeBranchLeftLeafy[0];
                    v[i2] = TileData.treeBranchLeftLeafy[1];
                } else {
                    u[i2] = TileData.treeBranchLeft[0];
                    v[i2] = TileData.treeBranchLeft[1];
                }
            }
            if (x < worldMap.width - 1 && MapHelper.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                if (y % 2 === 0) {
                    u[i2] = TileData.treeBranchRightLeafy[0];
                    v[i2] = TileData.treeBranchRightLeafy[1];
                } else {
                    u[i2] = TileData.treeBranchRight[0];
                    v[i2] = TileData.treeBranchRight[1];
                }
            }
            if (left && right) {
                u[i] = TileData.treeBaseBranchBoth[0];
                v[i] = TileData.treeBaseBranchBoth[1];
            } else if (left) {
                u[i] = TileData.treeBaseBranchLeft[0];
                v[i] = TileData.treeBaseBranchLeft[1];
            } else if (right) {
                u[i] = TileData.treeBaseBranchRight[0];
                v[i] = TileData.treeBaseBranchRight[1];
            } else {
                u[i] = TileData.treeBase[0];
                v[i] = TileData.treeBase[1];
            }
        }

        if (MapHelper.treeAt(worldMap, x, y)) {
            i = y * worldMap.width + x;
            let left = false;
            let right = false;
            if (x > 0 && MapHelper.treeAt(worldMap, x - 1, y)) {
                left = true;
                const i2 = i - 1;
                u[i2] = TileData.treeTrunkLeft[0];
                v[i2] = TileData.treeTrunkLeft[1];
            }
            if (x < worldMap.width - 1 && MapHelper.treeAt(worldMap, x + 1, y)) {
                right = true;
                const i2 = i + 1;
                u[i2] = TileData.treeTrunkRight[0];
                v[i2] = TileData.treeTrunkRight[1];
            }
            if (left && right) {
                u[i] = TileData.treeTrunkBoth[0];
                v[i] = TileData.treeTrunkBoth[1];
            } else if (left) {
                u[i] = TileData.treeBaseTrunkLeft[0];
                v[i] = TileData.treeBaseTrunkLeft[1];
            } else if (right) {
                u[i] = TileData.treeBaseTrunkRight[0];
                v[i] = TileData.treeBaseTrunkRight[1];
            } else {
                u[i] = TileData.treeBase[0];
                v[i] = TileData.treeBase[1];
            }
        }
    }

    static treeAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.Group === TileGroup.Tile && TileData.tree[tile.ID!];
    }

    static resolveStalactite(worldMap: WorldMap, x: number, y: number, v: number[]) {
        let i = y * worldMap.width + x;
        if (v[i] !== undefined) {
            return;
        }

        if (y > 0 && this.solidAt(worldMap, x, y - 1)) {
            // ceiling
            if (y < worldMap.height - 1 && this.stalactiteAt(worldMap, x, y + 1)) {
                // 2 tall
                v[i] = 0;
                v[i + worldMap.width] = 18;
            } else {
                // 1 tall
                v[i] = 72;
            }
        } else {
            // floor
            if (y < worldMap.height - 1 && this.stalactiteAt(worldMap, x, y + 1)) {
                // 2 tall
                v[i] = 36;
                v[i + worldMap.width] = 54;
            } else {
                // 1 tall
                v[i] = 90;
            }
        }

    }

    static stalactiteAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.Group === TileGroup.Tile && tile.ID === TileID.Stalactite;
    }

    static resolvePlantDetritus(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        if (v[i] !== undefined) {
            return;
        }

        let width = 1;
        while (x < worldMap.width && this.plantDetritusAt(worldMap, x + width, y)) {
            width++;
        }
        while (width > 4) {
            MapHelper.plantDetritus3(worldMap, x, y, u, v);
            y += 3;
            width -= 3;
        } 
        if (width === 4) {
            MapHelper.plantDetritus2(worldMap, x, y, u, v);
            y += 2;
            MapHelper.plantDetritus2(worldMap, x, y, u, v);
            y += 2;
        } else if (width === 3) {
            MapHelper.plantDetritus3(worldMap, x, y, u, v);
            y += 3;
        } else if (width === 2) {
            MapHelper.plantDetritus2(worldMap, x, y, u, v);
            y += 2;
        }
    }

    static plantDetritus3(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        let i2 = (y + 1) * worldMap.width + x;
        u[i] = 0;
        v[i] = 0;
        u[i2] = 0;
        v[i2] = 18;
        u[i + 1] = 18;
        v[i + 1] = 0;
        u[i2 + 1] = 18;
        v[i2 + 1] = 18;
        u[i + 2] = 36;
        v[i + 2] = 0;
        u[i2 + 2] = 36;
        v[i2 + 2] = 18;
    }

    static plantDetritus2(worldMap: WorldMap, x: number, y: number, u: number[], v: number[]) {
        let i = y * worldMap.width + x;
        let i2 = (y + 1) * worldMap.width + x;
        u[i] = 0;
        v[i] = 36;
        u[i2] = 0;
        v[i2] = 54;
        u[i + 1] = 18;
        v[i + 1] = 36;
        u[i2 + 1] = 18;
        v[i2 + 1] = 54;
    }

    static plantDetritusAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.Group === TileGroup.Tile && tile.ID === TileID.PlantDetritus;
    }

    static solidAt(worldMap: WorldMap, x: number, y: number) {
        const tile = worldMap.tile(x, y);
        return tile && tile.Group === TileGroup.Tile && TileData.solid[tile.ID!];
    }

    static needsWall(worldMap: WorldMap, x: number, y: number) {
        return !this.solidAt(worldMap, x, y + 1) && !this.solidAt(worldMap, x - 1, y) && !this.solidAt(worldMap, x + 1, y);
    }
}
