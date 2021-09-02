// library source and docs at https://github.com/Qix-/color
import  Color  from 'color'

// a simple implementation of a circular buffer for holding 
// a fixed size set of points in PointSet
import * as ps from './pointset';

// simple convenience 
function randomColor() {
    return Color({
        r: Math.random() * 255, 
        g: Math.random() * 255, 
        b: Math.random() * 255
    })
}

// yes, it's one line, but it's one less thing for you to figure out
function darken(color: Color) {
    return color.darken(0.25)   // creates a new color
}

// an interface that describes what our Rectangle object might look like.  
// Remember, a Typescript interface is just a description of the required
// properties (and methods, although we don't use methods here) an object
// must implement.  It is not a class or an object itself.
interface Rectangle {
    p1: ps.MousePosition;
    p2: ps.MousePosition;
    color: Color;
}

// A class for our application state and functionality
class Drawing {
    // the constructor paramater "canv" is automatically created 
    // as a property because the parameter is marked "public" in the 
    // constructor parameter
    //    canv: HTMLCanvasElement
    //
    // rendering context for the canvas, also public
    //    ctx: CanvasRenderingContext2D

    // some suggested properties you might use in your implementation
    mousePosition: ps.MousePosition | null = null;
    clickStart: ps.MousePosition | null = null;
    rects: Array <Rectangle>;   // an array that only contains objects that
                                // satisfy the Rectangle interface
    points: ps.PointSet;
    
    // a simple wrapper to reliably get the offset within an DOM element
    // We need this because the mouse position in the mouse event is
    // relative to the Window, but we want to specify draw coordinates
    // relative to the canvas DOM element  
    // see: http://www.jacklmoore.com/notes/mouse-position/
    static offset(e: MouseEvent): ps.MousePosition {
        e = e || <MouseEvent> window.event;

        var target = <Element> (e.target || e.srcElement),
            rect = target.getBoundingClientRect(),
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;

        return {x: offsetX, y: offsetY};
    }

    // Web pages are reactive; Javascript is single threaded, and all 
    // javascript code in your page is executed in response to 
    // some action.   Actions include
    // - by the user (various callbacks like mouse and keyboard callback)
    // - by timers (we can use a timeout function to execute something in
    //   the future)
    // - things like network actions (e.g., fetch this resource, call this
    //   code when it's been retrieved)
    // - a callback synchronized with the next display refresh rate 
    //   that was created for doing animation
    // 
    // We use the this last one, triggered by a call to 
    //      requestAnimationFrame(() => this.render());
    // to do continuous rendering.  The requestAnimationFrame has one
    // parameter, a function.  The "() => this.render()" syntax is a 
    // shorthand for writing inline functions.  It says "this is a function
    // with no parameters" ("() =>") whose body is one line of code, the 
    // "this.render()" call.  It could also be
    //              requestAnimationFrame(() => {
    //                   this.render()
    //                });
    // where the function body is betwee {} and we could write more methods.

    render() {
        // Store the current drawing transformation matrix (and other state)
        this.ctx.save();
        
        // Use the identity matrix while clearing the canvas (just in case you change it someday!)
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = "lightgrey";
        this.ctx.fillRect(0, 0, this.canv.width, this.canv.height);
        
        // Restore the transform
        this.ctx.restore();        

        // **** TODO *****
        // if the mouse is over the canvas, it's position is here, otherwise it's null
        // add code to deal with the mouse position each render frame
        if (this.mousePosition) {
            //this.ctx.fillStyle = this.rectColor.string();
            this.points.addPoint(this.mousePosition)
        } else {
            if(this.points.length > 0){
                this.points.dropPoint();
            }
        }

        // add code to draw rectangles we have so far at the back
         this.rects.forEach(element =>{
            var container = this.ctx.lineWidth
            this.ctx.lineWidth = 5
            var width = -element.p1.x + element.p2.x
            var height = -element.p1.y + element.p2.y
            this.ctx.strokeRect(element.p1.x, element.p1.y,width, height);
            this.ctx.beginPath();
            this.ctx.moveTo(element.p1.x, element.p1.y);
            this.ctx.lineTo(element.p2.x, element.p2.y);
            this.ctx.moveTo(element.p1.x + width, element.p1.y);
            this.ctx.lineTo(element.p2.x - width, element.p2.y);
            this.ctx.stroke();
            this.ctx.closePath();
            this.ctx.lineWidth = container
            var centerP: ps.MousePosition = {x: element.p1.x + width/2, 
                y: element.p1.y + height/2};
            var p1 = element.p1
            var p2: ps.MousePosition = {x: p1.x + width, y: p1.y}
            var p3: ps.MousePosition = {x: p2.x, y: p2.y + height}
            var p4: ps.MousePosition = {x: p1.x, y: p1.y + height}
            var smaller = Math.min(Math.abs(width), Math.abs(height));
            var num = Math.floor(smaller/128)
            var check = smaller%128
            if(check == 0){
                num = num -1;
            }
            Triangle(centerP, p1, p2, element.color, this.ctx, num);
            Triangle(centerP, p2, p3, element.color, this.ctx, num);
            Triangle(centerP, p3, p4, element.color, this.ctx, num);
            Triangle(centerP, p4, p1, element.color, this.ctx, num);



         });

        

         

        // add code to draw points with the oldest ones more transparent  
        var pointColor = darken(Color('blue'))
        this.ctx.fillStyle = pointColor.toString();
        for(let index = this.points.length -1; index >= 0; index --){
            var element = this.points.getPoint(index);
            this.ctx.fillRect(element.x, element.y, 5, 5);
            this.ctx.fillStyle = pointColor.fade(.7).toString()
        }
        
        // if we've clicked, add code draw the rubber band
        if (this.clickStart) {
            if(this.mousePosition != null){
                var original = this.ctx.strokeStyle
                var startx = this.clickStart.x
                var starty = this.clickStart.y
                this.ctx.strokeStyle = 'grey'
                this.ctx.strokeRect(this.clickStart.x, this.clickStart.y,
                    -this.clickStart.x + this.mousePosition.x, -this.clickStart.y + this.mousePosition.y)
                    this.ctx.strokeStyle = original
            } else {
                this.clickStart = null;
            }
            
        }


        


        // do it again!  and again!  AND AGAIN!  AND ...       
        requestAnimationFrame(() => this.render());
    }
    
    constructor (public canv: HTMLCanvasElement, public ctx: CanvasRenderingContext2D) {
        this.ctx = ctx
        this.rects = new Array(0)  // 0 sized array
        this.points = new ps.PointSet()
 

        // All interaction in browsers is done via event handlers.  Setting
        // "onmousedown", "onmouseup", "onmousemove", and "onmouseout" on
        // the Canvas DOM element to a function will cause that function to
        // be called when the appropriate action happens.

        canv.onmousedown = (ev: MouseEvent) => {
            // this method is called when a mouse button is pressed.
            var mousePosition = Drawing.offset(ev);   
            this.clickStart = mousePosition        
            this.mousePosition = mousePosition
        }
        
        canv.onmouseup = (ev: MouseEvent) => {
            // this method is called when a mouse button is released.
            const clickEnd = Drawing.offset(ev);

            // **** TODO *****
            // add code here to react to mouse up events
            if(this.clickStart != null){
                let rect: Rectangle = {p1 : this.clickStart, p2 : clickEnd, color: randomColor()};
                this.rects.push(rect);
                this.clickStart = null; // start another rect
            }
            this.mousePosition = clickEnd;

        }
        
        canv.onmousemove = (ev: MouseEvent) => {
            // this method is called when the mouse moves.   
            const mouse = Drawing.offset(ev);
            this.mousePosition = mouse 
            
        }
        
        canv.onmouseout = (ev: MouseEvent) => {
            // this method is called when the mouse goes out of
            // the window.  
            this.mousePosition = null;
            this.clickStart = null;
        }
    }
}

// a global variable for our state.  We implement the drawing as a class, and 
// will have one instance
var myDrawing: Drawing;

// main function that we call below.
// This is done to keep things together and keep the variables created self contained.
// It is a common pattern on the web, since otherwise the variables below woudl be in 
// the global name space.  Not a huge deal here, of course.

function exec() {
    // find our container
    var div = document.getElementById("drawing");

    if (!div) {
        console.warn("Your HTML page needs a DIV with id='drawing'")
        return;
    }

    // let's create a canvas and to draw in
    var canv = document.createElement("canvas");
    let ctx = canv.getContext("2d");
    if (!ctx) {
        console.warn("our drawing element does not have a 2d drawing context")
        return
    }
    
    div.appendChild(canv);

    canv.id = "main";
    canv.style.width = "100%";
    canv.style.height = "100%";
    canv.width  = canv.offsetWidth;
    canv.height = canv.offsetHeight;

    window.addEventListener('resize', (event) => {
        canv.width  = canv.offsetWidth;
        canv.height = canv.offsetHeight;
    });
    

    // create a Drawing object
    myDrawing = new Drawing(canv, ctx);
    
    // kick off the rendering!
    myDrawing.render(); 
}
function Triangle(center: ps.MousePosition , p1: ps.MousePosition, p2: ps.MousePosition, 
    color: Color, ctx: CanvasRenderingContext2D, num: number ){

        var midP1: ps.MousePosition = {x: (p1.x - center.x)/2 + center.x, y: (p1.y - center.y)/2 + center.y};
        var midP2: ps.MousePosition = {x: (p2.x - center.x)/2 + center.x, y: (p2.y - center.y)/2 + center.y};
        var midP3: ps.MousePosition = {x: (p2.x - p1.x)/2 + p1.x, y: (p2.y - p1.y)/2 + p1.y};
    
        ctx.fillStyle = color.toString()

        ctx.beginPath()

        ctx.strokeStyle = color.toString();
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(midP1.x, midP1.y);
        ctx.lineTo(midP1.x, midP1.y);
        ctx.lineTo(midP2.x, midP2.y);
        ctx.lineTo(midP3.x, midP3.y);
        ctx.stroke();
        ctx.fill()
        ctx.closePath()

        if(num > 0){
            Triangle(center, midP1, midP2, darken(color), ctx, num - 1);
            Triangle(midP1, p1, midP3, darken(color), ctx, num - 1);
            Triangle(midP2, midP3, p2, darken(color), ctx, num - 1);
        }

}

exec()