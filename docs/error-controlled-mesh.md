# Sampled error-controlled mesh comparison

The game asset test keeps Uniform and graded Adaptive modes and adds a tolerance
slider (0.25–8 percent of sphere radius). Release the slider or press **Fit mesh
to tolerance** to evaluate the CURRENT pose. Camera and controls are preserved.
The original mesh remains the startup default.

## Candidate selection

Evaluate graded meshes in this order, (transverse segments, radial rings):
(4,2), (6,3), (8,4), (12,6), (16,8), (24,12), (32,16), (48,24).
Choose the first whose maximum sampled surface/boundary error meets the requested
tolerance. If none passes, retain the finest candidate and report target exceeded.
This is discrete LOD selection using measured error, not arbitrary edge collapse
or a globally optimal triangulation. Tight targets can exceed the original count.

All candidates retain exact N, ground anchors, midpoint M, and matching side-edge
samples across neighbors. Boundary sampling density changes with the candidate.
See adaptive-mesh.md for the graded rows and zipper triangulation.

## Error measurement

For each triangle sample its parameter domain at the three edge midpoints,
centroid and barycentric coordinates (0.6,0.2,0.2) and permutations. Evaluate the
analytic spherical surface at each sample. Measure the Euclidean distance from
that exact point to the corresponding flat triangle (orthogonal plane distance
when the projection is inside; otherwise closest edge distance).
The surface readout is the largest sampled distance.

For every segment on the lower boundary and both side meridians, sample at
25%, 50% and 75%. Compare the analytic curve with linear interpolation between
the endpoints. Side-meridian apex samples use the fixed side u coordinate.
The boundary readout is the largest correspondence distance.
Tolerance comparison uses max(surface,boundary).

Distances are normalized by radius and displayed as percentages: 1% means
1.3 metres on a 130 metre sphere. This is world-relative error, not pixels.
The sphere chord formula R(1-cos(alpha/2)) provides intuition for edge sag;
it does not alone bound triangle interiors or the curved lower boundary.

These finite samples are estimates, NOT a certified Hausdorff bound. Sparse
sampling can miss local extrema. The metric is one-sided and uses corresponding
triangles, not a global nearest-surface search. No all-poses guarantee is claimed.
A tighter production implementation should refine sampling and validate a pose
envelope or conservatively bound derivatives.

## Motion, timing and limits

Fitting occurs on demand rather than every animation frame. The current mesh
is remeasured approximately every 750 ms; the readout flags a target exceedance
as the pose changes. The next update may be delayed by a busy frame. Click Fit
again to retessellate the new pose. Topology stays stable between fits.
Measurement and fitting run on the main thread and may cause visible stalls;
the FPS estimate includes their effects. This is a diagnostic tool, not a GPU
benchmark or production automatic LOD controller.

## Appearance

The preview has a generated blue/cyan mottled translucent Canvas pattern, with
optional wireframe. It uses deterministic sinusoidal noise on a 128x128 tile,
transparent alpha, and a batched Canvas surface fill. The pattern is screen-space
and is intended to help assess the silhouette and surface, not a final material.
Overlapping projections share a single translucent fill rather than physically layered transparency. GLB exports retain the
existing portable blue PBR material; this preview-only pattern is not baked into
the asset. A game should implement world-space noise in its shader.

## Tests

Error selection tests check a loose and tight request, error finiteness, explicit
unmet-tolerance behavior, and settings preservation. Existing topology tests
continue checking shared seams, anchors, sphere radius and rotational equivalence.
