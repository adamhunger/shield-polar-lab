# Uniform and adaptive shield meshes

The asset test starts with the original **Uniform** mesh. Click **Use Adaptive
mesh** to generate a graded mesh; click **Use Uniform mesh** to restore the
original. Pause motion first to compare identical poses. Camera, N, separation,
and influence are preserved. The readout reports triangle counts and reduction.
GLB export saves the selected mesh, including its mode in the controller recipe.

## Why the uniform mesh wastes samples

The spherical surface has constant curvature. Its parametric grid, however,
converges at N. Uniform sampling across every row creates many short edges and
thin triangles near the apex. More vertices there do not imply more geometric
detail. We already use one apex per petal instead of a row of coincident vertices.

## Implemented algorithm: graded parametric tessellation

For S transverse segments and J radial rows, row j uses:

    v_j = j / J
    m_j = min(S, max(2, 2 ceil(S v_j / 2)))

The final row always uses S, exactly matching the original boundary. Even
interior segment counts include u=0. Samples are u_i = -1 + 2i/m_j.
Each vertex retains (u,v,petalIndex) and is evaluated by the same spherical
equations as the original mesh.

A monotone zipper triangulation connects neighboring rows: advance whichever
row has the smaller next normalized transverse coordinate, emitting one triangle.
The first row is joined to the apex with a triangle fan.

Both sides of every petal retain the original radial samples. Adjacent petals
therefore have identical shared-edge coordinates, with no T-junctions.
Ground anchors, N, M, and the complete sampled lower boundary are preserved.
The same topology is used for every petal, preserving 30-degree rotational
equivariance.

Topology is rebuilt only when switching mode. During motion the vertex/index
counts stay constant and position/normal arrays are reused. A game integrating
the toggle must recreate its GPU buffers on mode changes; normal direction
updates only upload vertex data.

## Scope and error

This first Adaptive mode is **distance-graded**, not an error-tolerance-driven
optimizer. It reduces crowding near N without promising a maximum approximation
error over every pose. It does not implement quadric edge collapse.

For a spherical chord spanning angle alpha, the maximum inward edge deviation is:

    e = R (1 - cos(alpha / 2))

This bounds an individual spherical arc versus its chord, not the entire triangle
or the non-great-circle petal boundary. Surface triangle interiors and boundary
segments need separate sampling against the analytic surface for full validation.

A future error-controlled version would refine parameter triangles where sampled
surface/boundary error exceeds a chosen tolerance, reconcile shared edges, and
validate across N positions and influence/separation extremes. Precomputed LOD
topologies would avoid per-frame connectivity changes and popping would need
separate handling. No claimed tolerance or reduction target is assumed here.

## Validation

The regression checks cover both modes across multiple polar/azimuth positions,
5/30-degree separation and 0.25/4 influence: sphere containment, fixed anchors,
shared edges, outward nondegenerate triangles, 30-degree equivariance, unchanged
boundary samples and stable buffers during deformation. Visual comparison remains
important, especially near the extreme control settings.

## Framerate estimator

The display reports 1000 divided by the mean requestAnimationFrame interval over
the last 60 visible frames, alongside the mean interval in milliseconds. It starts
reporting after ten samples. Switching meshes or changing tab visibility clears
the window so measurements from different modes/background throttling do not mix.
Long visible-frame stalls remain in the sample. This is browser frame cadence,
not GPU execution time; it is affected by refresh rate, browser load and the
active preview renderer (WebGPU, WebGL2 or Canvas). Pause freezes geometry motion, not rendering.
Compare modes at the same pose, camera, viewport and motion setting, allowing
a full sample window to settle. CPU geometry timing is separate.
