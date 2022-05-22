class MathFunction {

  constructor(f) {
    this.f = f;
  }

  get(x) {
    if (this.f) {
      return this.f(x);
    }
    return 0;
  }

  draw() {
    for (let x = 0; x < width; x++) {
      vertex(x, this.get(x));
    }
  }
}

class CombinedMathFunction extends MathFunction {

  constructor(...args) {
    super();
    this.functions = args;
  }

  get(x) {
    let y = 0;
    for (let f of this.functions) {
      y += f.get(x);
    }
    return y;
  }
}

class BezierHelper {
  
  constructor(x1, y1, cpx1, cpy1, cpx2, cpy2, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.cpx1 = cpx1;
    this.cpy1 = cpy1;
    this.cpx2 = cpx2;
    this.cpy2 = cpy2;
    this.x2 = x2;
    this.y2 = y2;
    // depending on preferred_length, at last point x/y
    this.end_x = null;
    this.end_y = null;
    // all points from x1/y1 to x2/y2
    this.values_x = [];
    this.values_y = [];
    this.values_effective_x = [];
    this.values_effective_y = [];
    // to shorten the bezier curve along its path
    this.preferred_length = -1;
    this.calc();
  }

  calc() {
    let length_estimation = (int) (5 * sqrt(pow(this.x1 - this.x2, 2) + pow(this.y1 - this.y2, 2)));
    for (let i = 0; i <= length_estimation; i++) {
      let factor = i / length_estimation;
      this.values_x.push(this.get_x(factor));
      this.values_y.push(this.get_y(factor));
    }
    this.total_length = 0;
    for (let i = 0; i < this.values_x.length - 1; i++) {
      let last_x = this.values_x[i];
      let last_y = this.values_y[i];
      let x = this.values_x[i + 1];
      let y = this.values_y[i + 1];
      this.total_length += sqrt(pow(x - last_x, 2) + pow(y - last_y, 2));
    }
    if (this.preferred_length < 0) {
      this.preferred_length = this.total_length;
    }
    this.update_end();
  }
  
  update_end() {
    // end_x and end_y
    this.values_effective_x = [];
    this.values_effective_y = [];
    let drawn_length = 0;
    for (let i = 0; i < this.values_x.length - 1; i++) {
      let prev_x = this.values_x[i];
      let prev_y = this.values_y[i];
      let x = this.values_x[i + 1];
      let y = this.values_y[i + 1];
      let current_length = sqrt(pow(x - prev_x, 2) + pow(y - prev_y, 2));
      if (drawn_length + current_length < this.preferred_length) {
        this.values_effective_x.push(x);
        this.values_effective_y.push(y);
        drawn_length += current_length;
      } else {
        let remaining_length = this.preferred_length - drawn_length;
        let factor = (current_length - remaining_length) / current_length;
        this.end_x = (x - prev_x) * factor + prev_x;
        this.end_y = (y - prev_y) * factor + prev_y;
        this.values_effective_x.push(this.end_x);
        this.values_effective_y.push(this.end_y);
        break;
      }
    }
  }
  
  get_x(factor) {
    return bezierPoint(this.x1, this.cpx1, this.cpx2, this.x2, factor);
  }
  
  get_y(factor) {
    return bezierPoint(this.y1, this.cpy1, this.cpy2, this.y2, factor);
  }
  
  shorten(new_length) {
    this.preferred_length = new_length;
    this.update_end();
  }
  
  draw() {
    for (let i = 0; i < this.values_effective_x.length; i++) {
      vertex(this.values_effective_x[i], this.values_effective_y[i]);
    }
  }
  
  draw_reverse() {
    for (let i = this.values_effective_x.length - 1; i >= 0; i--) {
      vertex(this.values_effective_x[i], this.values_effective_y[i]);
    }
  }
}

class SideMountain extends MathFunction {
  
  constructor(w, h, stepper = null) {
    super();
    this.w = w;
    this.h = h;
    this.intervals = [];
    let start_y = height / 2;
    if (stepper == null)  {
      stepper = this.default_stepper;
    }
    let x = 0;
    let y = start_y;
    let cp_last_y = y;
    let cp_last_x = -10;
    while (x < width) {
      let prev_x = x;
      let prev_y = y;
      let offset = stepper(x, y, prev_x, prev_y, this);
      x += offset[0];
      y += offset[1];
      y = min(height, max(0, y));
      let m = (float) (prev_y - cp_last_y) / (prev_x - cp_last_x);
      let cp1_x = (x - prev_x) / 3.0 + prev_x;
      let cp1_y = (cp1_x - prev_x) * m + prev_y;
      let cp2_x = (x - prev_x) * 2.0 / 3.0 + prev_x;
      //offset = stepper(x, y, prev_x, prev_y, this);
      // TODO:
      //offset[1] = 0;
      let cp2_y = prev_y + offset[2];
      cp2_y = min(height, max(0, cp2_y));
      let interval = new BezierHelper(prev_x, prev_y, cp1_x, cp1_y, cp2_x, cp2_y, x, y);
      this.intervals.push(interval);
      cp_last_x = cp2_x;
      cp_last_y = cp2_y;
    }
  }

  default_stepper(x, y, prev_x, prev_y, that) {
    const offset_x_low = 50;
    const offset_x_high = 100;
    const offset_y_low = -100;
    const offset_y_high = 100;
    return [
      random(offset_x_low, offset_x_high),
      random(offset_y_low, offset_y_high),
      random(offset_y_low, offset_y_high)
    ];
  }
  
  draw() {
    noFill();
    beginShape();
    for (let interval of this.intervals) {
      interval.draw();
    }
    endShape();
    beginShape();
    for (let interval of this.intervals) {
      vertex(interval.x1, interval.y1);
      vertex(interval.x2, interval.y2);
    }
    endShape();
  }
  
  getY(x) {
    for (let interval of this.intervals) {
      if (interval.x1 <= x && x <= interval.x2) {
        let f = (float) (x - interval.x1) / (interval.x2 - interval.x1);
        let y = bezierPoint(interval.y1, interval.cpy1, interval.cpy2, interval.y2, f);
        return y;
      }
    }
    return -1;
  }

  get(x) {
    let y = this.getY(x);
    if (y > 0) {
      return y;
    }
    return 0;
  }
}

function setup() {
  createCanvas(1000, 1000);
  noLoop();
}

function draw() {
  let w = width * 0.5;
  let h = -height;
  let cpstartx = w * 0.1;
  let cpstarty = h * 0.1;
  let cpendx = 0;
  let cpendy = h * 0.14;
  let end_offset = width * 0.9;
  let end_slope = random(0, 1) < 0.5 ? random(-20, -100) : 0;
  let mountain = new SideMountain(width, height,
    (x, y, prev_x, prev_y, that) => {
      const offset_x_low = 20;
      const offset_x_high = 50;
      const offset_y_low = -10;
      const offset_y_high = 10;
      let offset = [
        random(offset_x_low, offset_x_high),
        random(offset_y_low, offset_y_high),
        random(offset_y_low, offset_y_high)
      ];
      if (x > end_offset && end_slope != 0) {
        offset[1] = end_slope;
        offset[2] = 0
      }
      return offset;
  });
  end_length_function = new MathFunction((x) => {
    // if (x > end_offset) {
    //   let rel_x = x - end_offset;
    //   let result = 8 * rel_x;
    //   return result;
    // }
    return 0;
  });
  let leaf_length_function = new CombinedMathFunction(
    mountain, end_length_function);

  // push();
  // translate(0, height);
  // scale(1, -1);
  // // draw effective function
  // // beginShape();
  // // leaf_length_function.draw();
  // // endShape();

  // // draw mountain
  // // stroke(255, 0, 0);
  // // beginShape();
  // // mountain.draw();
  // // endShape();
  // pop();

  push();
  stroke(0);
  translate(width / 2, height);
  let right_veins = [];
  let left_veins = [];
  let border_x = [];
  let border_y = [];
  let angle_start = random(-10, 30);
  let angle_end = 90;
  let angle_range = angle_end - angle_start;
  let stepcount = angle_range * 1.25;
  for (let i = 0; i <= stepcount; i++) {
    let f = i / stepcount;
    let a = angle_start + angle_range * f;
    let endx = cos(-radians(a)) * w;
    let endy = sin(-radians(a)) * w * 1.2;
    let cpx = cpstartx + (cpendx - cpstartx) * f;
    let cpy = cpstarty + (cpendy - cpstarty) * f;
    let length = leaf_length_function.get((int) (width * f));
    let bezier_helper = new BezierHelper(0, 0, cpx, cpy, cpx, cpy, endx, endy); 
    let length_factor = length / height;
    bezier_helper.shorten(bezier_helper.total_length * length_factor);
    border_x.push(bezier_helper.end_x);
    border_y.push(bezier_helper.end_y);
    right_veins.push(bezier_helper);
    if (i != stepcount) {
      bezier_helper = new BezierHelper(0, 0, -cpx, cpy, -cpx, cpy, -endx, endy); 
      bezier_helper.shorten(bezier_helper.total_length * length_factor);
      left_veins.push(bezier_helper);
    }
  }
  fill(random(0, 200), random(200, 250), random(0, 150));
  beginShape();
  vertex(0, 0);
  right_veins[0].draw();
  for (let i = 0; i < border_x.length; i++) {
    vertex(border_x[i], border_y[i]);
  }
  for (let i = border_x.length - 1; i >= 0; i--) {
    vertex(-border_x[i], border_y[i]);
  }
  left_veins[0].draw_reverse();
  endShape();
  noFill();
  for (let vein of right_veins) {
    beginShape();
    vein.draw();
    endShape();
  }
  for (let vein of left_veins) {
    beginShape();
    vein.draw();
    endShape();
  }
}