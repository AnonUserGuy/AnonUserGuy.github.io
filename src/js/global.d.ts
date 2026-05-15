interface Attributes {
    [key: string]: string;
}
interface RandomNumberGenerator {
    (): number;
}
declare function promiseFileAsText(file: File): Promise<string | null>;
declare function promiseFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null>;
declare function download(file: Blob | File, filename?: string, type?: string): any;
declare function createElementEX(tagName: string, attributes: Attributes, children: (HTMLElement | any)[]): any;
declare const dotEl: HTMLElement;
declare const loadingEl: HTMLElement;
declare function loading(bool: boolean): any;
declare function delay(s: number): Promise<void>;
declare function tsh(s: string): number;
declare function random(seed: string | number): RandomNumberGenerator;