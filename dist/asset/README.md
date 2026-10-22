# Procedural shield game asset prototype

Open `asset/` on the local server (or GitHub Pages after this branch is deployed).
The original Polar Lab is unchanged. This harness renders the shield with WebGPU
(`gpu.mjs`), falling back to WebGL2 (`skin.mjs`) and then plain Canvas. Ground and
labels are Canvas layers, so the controller stays independent of any game renderer.

## Run

From the repository root: `npm start`, then open http://localhost:8080/asset/.
Run `node tools/check-asset.mjs` for the asset regression checks.

The harness offers a dynamic direction source, a ±15° wedge sweep, manual controls,
a 30° direction step, and an export of the current pose as `shield.glb`.

## Integrate without an asset loader

Copy `asset/controller.mjs` and `geometry.mjs`, keeping their relative paths.

```js
import { ShieldController } from './asset/controller.mjs';
const shield = new ShieldController({ radius: 130, segments: 32, rings: 16 });
// Create your engine's indexed mesh once using:
// shield.positions, shield.normals, shield.indices.
shield.setParameters({ separation: 20, influence: 1.5 });
function onTargetChanged(localDirection) {
  shield.setDirection(localDirection);
  // Upload positions and normals into the EXISTING GPU buffers.
  // Indices and vertex count never change during deformation.
}
```

Direction is a nonzero, finite XYZ vector FROM the dome centre TOWARD the desired
junction, in shield-local Z-up coordinates. Convert world positions/directions
through the inverse shield transform first. An incoming projectile velocity may
point the opposite way: use the predicted sphere crossing position relative to
the centre. The controller normalizes direction, clamps polar displacement to
0–50°, and preserves azimuth at the pole. It intentionally does not smooth or
predict motion: the game owns those decisions. Stations stay fixed in the shield's
local frame. Moving the shield's parent would also move its stations.

Shared separation is clamped to 5–30°, influence to 0.25–4. The current 50° polar
limit is retained even when smaller separation would permit more travel.
Positions and normals are Float32Arrays reused in place; indices are Uint32Array.
The parameter buffer stores (u,v,petalIndex) per vertex. Topology uses one apex
per petal and excludes zero-area apex triangles. Normals are radial analytic
sphere normals. The prototype CPU evaluator still creates temporary vectors;
profile your target hardware before deploying large numbers of shields.

## GLB path

The GLB is a portable STATIC snapshot with an opaque blue, double-sided PBR
material, one indexed mesh containing twelve petals, N and twelve named station
nodes. It uses local Z-up mesh coordinates with a root rotation converting to
glTF's Y-up. Keep that root rotation when loading. The mesh includes a custom
`_SHIELD_UVK` VEC3 attribute. The root's `extras.shield` holds the controller version,
settings and coordinate convention. No executable code is embedded.

For this exporter, recreate a ShieldController from root.extras.shield. Its vertex
order matches the exported mesh exactly. Attach its positions/normals to the loaded
mesh and update those buffers when N changes. Update the named N node from shield.N;
leave ground station nodes unchanged. Never apply the Y-up conversion twice.
If a modelling tool welds, reorders, or decimates vertices, this ordering contract
is no longer valid: retain `_SHIELD_UVK` and evaluate each vertex from that attribute,
or regenerate the original mesh. Some loaders discard custom attributes/extras;
verify their preservation in your chosen engine.

The GLB does not include glow, shimmer, impact physics or runtime logic. Those are
game effects. The harness renderers are only for testing; the arrays work with any
indexed-mesh engine. The existing main demo remains the WebGPU reference viewer.

## Symmetry

S(theta, phi+30°, delta, w) = Rz(30°) S(theta, phi, delta, w), with petal indices
shifted by one. This is a symmetry of the family, not twelvefold symmetry of every
individual off-pole pose. Sector reporting uses the petal-centred wedge [-15°,15°).
Geometry never folds or snaps the azimuth at sector boundaries.

## Validation

`tools/check-asset.mjs` exercises rotational equivariance, fixed stations, unit
radius, reusable arrays, clamping, outward triangle winding, nondegenerate apex
triangles, and GLB chunk/accessor bounds. These checks do not replace testing the
export in the destination engine. The procedural source is under the repository's
MIT license.
