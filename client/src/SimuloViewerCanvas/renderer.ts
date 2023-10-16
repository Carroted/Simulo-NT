import type { Ball, Polygon, Cuboid, Plane } from "../../../shared/src/ShapeContentData";
import ShapeContentData from "../../../shared/src/ShapeContentData";
import ShapeTransformData from "../../../shared/src/ShapeTransformData";
import OverlayShape from "../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/OverlayShape";
import SimuloText from "../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/SimuloText";
import WorldUpdate from "../../../shared/src/plugins/SimuloPhysicsSandboxServerPlugin/WorldUpdate";
/*
function rotateVerts(verts: { x: number, y: number }[], angle: number) {
    // Whoah there! hold up, if (angle % 2pi) is 0, then we don't need to rotate anything!
    if (angle % (2 * Math.PI) == 0) {
        return verts; // This will slightly improve performance when rotating a lot of verts all the time, which we do every frame
    }

    // rotate the vertices at the origin (0,0)
    let rotatedVertices: { x: number, y: number }[] = [];
    let vertLength = verts.length;
    for (let i = 0; i < vertLength; i++) {
        // use math to rotate the vertices
        let rotatedX = verts[i].x * Math.cos(angle) - verts[i].y * Math.sin(angle);
        let rotatedY = verts[i].x * Math.sin(angle) + verts[i].y * Math.cos(angle);
        // add the rotated vertices to the array
        rotatedVertices.push({ x: rotatedX, y: rotatedY });
    }
    return rotatedVertices;
}*/

export default class SimuloRendererCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }
    drawVertsAt(x: number, y: number, verts: { x: number, y: number }[], rotation = 0) {
        this.ctx.beginPath();
        //verts = rotateVerts(verts, rotation)
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        verts.forEach(e => {
            this.ctx.lineTo((e.x), (e.y));
        });
        this.ctx.closePath();
        //ctx.strokeStyle = '#000000a0';

        this.ctx.save();
        this.ctx.clip();
        this.ctx.lineWidth *= 2;
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();

        // now fix the rotation and translation
        this.ctx.rotate(-rotation);
        this.ctx.translate(-x, -y);
        /*
            ctx.fill();
            ctx.stroke();
            */
    }
    drawVertsNoFillAt(x: number, y: number, verts: { x: number, y: number }[], rotation = 0) {
        this.ctx.beginPath();
        //verts = rotateVerts(verts, rotation);
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        verts.forEach(e => {
            this.ctx.lineTo((e.x), (e.y));
        });
        this.ctx.closePath();
        // set stroke color
        this.ctx.strokeStyle = '#9ac4f1';
        // set line width
        this.ctx.lineWidth = 0.01;
        this.ctx.stroke();
        // reset to transparent
        this.ctx.strokeStyle = 'transparent';

        // now fix the rotation and translation
        this.ctx.rotate(-rotation);
        this.ctx.translate(-x, -y);
    }

    drawCircleAt(x: number, y: number, radius: number, rotation = 0, circleCake = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        // if circleCake, draw a partial circle (20 degrees)
        if (circleCake) {
            // fill color darker
            this.ctx.fillStyle = '#00000080';
            this.ctx.strokeStyle = 'transparent';
            this.ctx.beginPath();
            //ctx.arc(x, y, radius, 0, 20 * Math.PI / 180);
            // offset based on rotation
            this.ctx.arc(x, y, radius, rotation, rotation + 23 * Math.PI / 180);
            this.ctx.lineTo(x, y);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    drawVerts(verts: { x: number, y: number }[]) {
        this.ctx.beginPath();
        verts.forEach(e => this.ctx.lineTo(e.x, e.y));
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawStretchedImageLine(image: HTMLImageElement, x1: number, y1: number, x2: number, y2: number, useHeight: boolean, otherAxisLength: number) {
        // if useHeight is true, we will stretch along height between p1 and p2. if false, we will stretch along width between p1 and p2
        if (useHeight) {
            // draw between 2 points, offsetting other axis by half of otherAxisLength
            let angle = Math.atan2(y2 - y1, x2 - x1);
            let length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            let halfOtherAxisLength = otherAxisLength / 2;
            this.ctx.save();
            this.ctx.translate(x1, y1);
            this.ctx.rotate(angle);
            this.ctx.drawImage(image, -halfOtherAxisLength, 0, otherAxisLength, length);
            this.ctx.restore();
        } else {
            // draw between 2 points, offsetting other axis by half of otherAxisLength
            let angle = Math.atan2(y2 - y1, x2 - x1);
            let length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            let halfOtherAxisLength = otherAxisLength / 2;
            this.ctx.save();
            this.ctx.translate(x1, y1);
            this.ctx.rotate(angle);
            this.ctx.drawImage(image, 0, -halfOtherAxisLength, length, otherAxisLength);
            this.ctx.restore();
        }
    }

    drawRect(x: number, y: number, width: number, height: number) {
        this.ctx.fillRect(x, y, width, height);
    }

    drawText(text: string, x: number, y: number, size: number, color: string, font: string = "urbanist",
        align: "left" | "center" | "right" = "left", baseline: "alphabetic" | "top" | "middle" | "bottom" = "alphabetic") {
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.font = `${size}px ${font}`;
        this.ctx.fillText(text, x, y);
    }

    outlinedImage(img: HTMLImageElement, s: number, color: string, x: number, y: number, width: number, height: number) {
        let canvas2 = document.createElement('canvas');
        let ctx2 = canvas2.getContext('2d') as CanvasRenderingContext2D;
        canvas2.width = width + (s * 4);
        canvas2.height = height + (s * 4);
        ctx2.imageSmoothingEnabled = false;
        // @ts-ignore
        ctx2.mozImageSmoothingEnabled = false; // we ignore because typescript doesnt know about these
        // @ts-ignore
        ctx2.webkitImageSmoothingEnabled = false;
        // @ts-ignore
        ctx2.msImageSmoothingEnabled = false;

        let dArr = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1], // offset array
            i = 0;  // iterator

        // draw images at offsets from the array scaled by s
        for (; i < dArr.length; i += 2)
            ctx2.drawImage(img, (1 + dArr[i] * s) + s, (1 + dArr[i + 1] * s) + s, width, height);

        // fill with color
        ctx2.globalCompositeOperation = "source-in";
        ctx2.fillStyle = color;
        ctx2.fillRect(0, 0, width + (s * 4), height + (s * 40));

        // draw original image in normal mode
        ctx2.globalCompositeOperation = "source-over";
        ctx2.drawImage(img, 1 + s, 1 + s, width, height);

        this.ctx.drawImage(canvas2, x - 1 - s, y - 1 - s);
    }

    // polyfill for roundRect
    roundRect(x: number, y: number, w: number, h: number, r: number) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
        return this.ctx;
    }

    roundTri(x: number, y: number, w: number, h: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, 10);
        this.ctx.arcTo(x + w, y + h, x, y + h, 10);
        this.ctx.arcTo(x, y + h, x, y, 10);
        this.ctx.closePath();
        return this.ctx;
    }
    private cachedImages: { [key: string]: HTMLImageElement } = {};
    getImage(src: string) {
        if (this.cachedImages[src] != undefined) {
            return this.cachedImages[src];
        }
        else {
            let img = new Image();
            img.src = src;
            this.cachedImages[src] = img;
            return img;
        }
    }
    transformPoint(x: number, y: number) {
        let newX, newY;
        newX = (x - this.ctx.getTransform().e) / (this.ctx.getTransform().a);
        newY = (y - this.ctx.getTransform().f) / (this.ctx.getTransform().d);
        return { x: newX, y: newY };
    }
    updateTransform(zoom: number) {
        this.ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
    }
    contentDatas: {
        [id: string]: {
            content: ShapeContentData,
            color: string
        }
    } = {};
    transformDatas: { [id: string]: ShapeTransformData } = {};
    overlays: {
        shapes: OverlayShape[],
        texts: SimuloText[]
    } = {
            shapes: [],
            texts: []
        };
    update(worldUpdate: WorldUpdate) {
        worldUpdate.delta.removedContents.forEach((id) => {
            delete this.contentDatas[id];
        });
        for (let id in worldUpdate.delta.shapeContent) {
            this.contentDatas[id] = {
                content: worldUpdate.delta.shapeContent[id],
                color: '#' + worldUpdate.delta.shapeContent[id].color.toString(16).padStart(6, '0') + (Math.round(worldUpdate.delta.shapeContent[id].alpha * 255)).toString(16).padStart(2, '0')
            };
        }
        for (let id in worldUpdate.delta.shapeTransforms) {
            this.transformDatas[id] = worldUpdate.delta.shapeTransforms[id];
        }
        this.overlays = worldUpdate.overlays;
    }
    renderWorld(cameraZoom: number) {
        let contentDatas = Object.assign({}, this.contentDatas);
        let transformDatas = Object.assign({}, this.transformDatas);
        let overlays = this.overlays;
        overlays.shapes.forEach((shape) => {
            contentDatas[shape.content.id] = {
                content: shape.content,
                color: '#' + shape.content.color.toString(16).padStart(6, '0') + (Math.round(shape.content.alpha * 255)).toString(16).padStart(2, '0')
            };
            transformDatas[shape.content.id] = shape.transform;
        });
        this.render(contentDatas, transformDatas, overlays.texts, cameraZoom);
    }
    render(contents: {
        [id: string]: {
            content: ShapeContentData,
            color: string
        }
    }, transforms: { [id: string]: ShapeTransformData }, texts: SimuloText[], zoom: number, handleZooming = false) {
        if (handleZooming) {
            this.updateTransform(zoom);
        }
        // clear the thing
        let topLeft = this.transformPoint(0, 0);
        let bottomRight = this.transformPoint(this.canvas.width, this.canvas.height);
        this.ctx.clearRect(topLeft.x, topLeft.y, this.canvas.width / zoom, this.canvas.height / zoom);
        // fill
        this.ctx.fillStyle = '#a1acfa';
        // no border
        this.ctx.strokeStyle = 'transparent';
        // the shapes are verts
        let keys = Object.keys(contents);
        let keyLength = keys.length;
        for (let i = 0; i < keyLength; i++) {
            let key = keys[i];
            let content = contents[key];
            let transform = transforms[key];

            if (!transform) continue;

            let shapeHeight = 0;
            let shapeWidth = 0;
            // content.color is a hex number like 0x000000, we have to turn that to hex string
            this.ctx.fillStyle = content.color;
            if (content.content.border) {
                this.ctx.strokeStyle = '#' + content.content.border.toString(16).padStart(6, '0');
                this.ctx.lineWidth = content.content.borderWidth as number / (content.content.borderScaleWithZoom ? zoom : 1);
            }
            else {
                this.ctx.strokeStyle = 'transparent';
            }

            if (content.content.type === 'polygon') {
                let shapePolygon = content.content as Polygon;
                shapePolygon.points.forEach(function (vert) {
                    if (Math.abs(vert[0]) > shapeWidth) shapeWidth = Math.abs(vert[0]);
                    if (Math.abs(vert[1]) > shapeHeight) shapeHeight = Math.abs(vert[1]);
                });
            }
            else if (content.content.type === 'cuboid') {
                let shapeRectangle = content.content as Cuboid;
                shapeWidth = shapeRectangle.width;
                shapeHeight = shapeRectangle.height;
            }
            else if (content.content.type === 'ball') {
                let shapeCircle = content.content as Ball;
                shapeWidth = shapeCircle.radius as number;
                shapeHeight = shapeCircle.radius as number;
            }

            if (content.content.image) {
                let image = this.getImage(content.content.image);
                if (image) {
                    this.ctx.save();
                    let imageTranslation = content.content.imageTransformations ? content.content.imageTransformations.translate : { x: 0, y: 0 }
                    let imageScale = content.content.imageTransformations ? content.content.imageTransformations.scale : 1;
                    let imageRotation = content.content.imageTransformations ? content.content.imageTransformations.rotate : 0;
                    this.ctx.translate(transform.x + imageTranslation.x, -transform.y - imageTranslation.y);
                    this.ctx.rotate(-transform.angle - imageRotation);
                    // rotate 180deg
                    this.ctx.rotate(Math.PI);
                    // width is determined based on shape size. height is determined based on image aspect ratio
                    try {
                        this.ctx.drawImage(image, -shapeWidth, -shapeHeight, shapeWidth * 2, shapeHeight * 2);
                    }
                    catch (e) {
                        console.error(e);
                    }
                    this.ctx.restore();
                }
            }

            if (content.content.type === 'polygon') {
                let shapePolygon = content.content as Polygon;
                /*
                if (shapePolygon.decomposedParts) {
                    for (let j = 0; j < shapePolygon.decomposedParts.length; j++) {
                        let part = shapePolygon.decomposedParts[j];
                        this.ctx.fillStyle = '#ffffff30';
                        this.ctx.strokeStyle = '#ffffffff';
                        this.ctx.lineWidth = 1 / this.cameraZoom;
                        this.drawVertsAt(shapePolygon.x, shapePolygon.y, part.map(function (vert) {
                            return { x: vert[0], y: vert[1] };
                        }), shapePolygon.angle);
                    }
                }
                else */
                this.drawVertsAt(transform.x, -transform.y, shapePolygon.points.map((points) => {
                    return { x: points[0], y: -points[1] };
                }), -transform.angle);
            }
            else if (content.content.type === 'ball') {
                let shapeCircle = content.content as Ball;
                // console.log('drawing circle');
                this.drawCircleAt(transform.x, -transform.y, shapeCircle.radius as number, -transform.angle, shapeCircle.cakeSlice);
            }
            /*else if (shape.type === 'edge') {
                let shapeEdge = shape as SimuloEdge;
                //console.log('drawing edge');
                this.drawVertsNoFillAt(shapeEdge.x, shapeEdge.y, shapeEdge.vertices, shapeEdge.angle);
            }*/
            else if (content.content.type === 'cuboid') {
                let shapeRectangle = content.content as Cuboid;
                //console.log('drawing rectangle');
                let verts = [
                    { x: -shapeRectangle.width / 2, y: -shapeRectangle.height / 2 },
                    { x: shapeRectangle.width / 2, y: -shapeRectangle.height / 2 },
                    { x: shapeRectangle.width / 2, y: shapeRectangle.height / 2 },
                    { x: -shapeRectangle.width / 2, y: shapeRectangle.height / 2 }
                ];
                this.drawVertsAt(transform.x, -transform.y, verts, -transform.angle);
            }

            if (content.content.text) {
                this.drawText(content.content.text.text, transform.x, -transform.y, content.content.text.fontSize, '#' + content.content.text.color.toString(16).padStart(6, '0'), content.content.text.fontFamily, content.content.text.align, content.content.text.baseline);
            }
        }

        // Draw any text that is not attached to a shape
        let textLength = texts.length;
        for (let i = 0; i < textLength; i++) {
            let text = texts[i];
            this.drawText(text.text, text.transform.x, -text.transform.y, text.fontSize, '#' + text.color.toString(16).padStart(6, '0'), text.fontFamily, text.align, text.baseline);
        }
    }

    reset() {
        this.contentDatas = {};
        this.transformDatas = {};
        this.overlays = {
            shapes: [],
            texts: []
        };
    }
}