import java.util.ArrayList;
import java.util.List;
import processing.core.PVector;

List<Bug> bugs = new ArrayList<Bug>();
int w = 500;

abstract class Actor {
    protected PVector pos;
    protected float rot;
    protected float sc;

    Actor(PVector pos, float rot, float sc) {
        this.pos = pos;
        this.rot = rot;
        this.sc = sc;
    }

    public void draw() {
        step();
        pushMatrix();
        pushStyle();
        translate(pos.x, pos.y);
        rotate(rot);
        scale(sc);
        detail();
        popStyle();
        popMatrix();
    }
    public void detail();
    public void step();
}

class Bug extends Actor {
  final int index;
  final color c;

  Bug(int index, color c, PVector pos, float rot, float sc) {
      super(pos, rot, sc);
      this.index = index;
      this.c = c;
  }

  public void step() {
      float dr = map(noise(frameCount/100f, index), 0, 1, radians(-6), radians(4.5f));
      rot += dr;
      float d = noise(frameCount/200f, index+0.1f);
      pos.x += d * cos(rot);
      pos.y += d * sin(rot);
  }

  public void detail() {
      noStroke();
      fill(c);
      ellipse(0, 0, 1.9f, 2);
      fill(0, 0, 0);
      ellipse(0.5f, 0.2f, 0.3f, 0.2f);
      ellipse(0.5f, -0.2f, 0.3f, 0.2f);
      strokeWeight(0.05f);
      noFill();
      stroke(0);
      arc(0, 0, 1.7f, 1.0f, -0.3f, 0.3f);
  }
}

public void setup() {
    for (int i = 0; i < 50; i++) {
        bugs.add(new Bug(i,
            color(100 + random(100), 100 + random(100), 100 + random(100), random(80, 200)),
            new PVector(random(-0.3f * w, 0.3f * w), random(-0.3f * w, 0.3f * w)),
            random(TWO_PI),
            10 + random(20)
        ));
    }
    smooth();
    size(w, w);
}

public void draw() {
    translate(w / 2, w / 2);
    background(200);
    for (Bug b : bugs) {
        b.draw();
    }
}

