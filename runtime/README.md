# Revised Meta integration source

These modules are copied from the revised local experiment implementation. The output allowance is 8,192 tokens and the timeout ceiling is 60 seconds. These historical settings and rates are not a current spending authorization.

Run the root `npm run test:runtime` command for network-blocked fixture tests. No actual provider request is made. The runtime defaults to disabled and direct CLI live use is rejected. No live launcher or real authorization record is included.

The runner test's scratch path is local to this copy. Two tests requiring original private sibling directories are omitted here: the v1/v2 historical request comparison and the original consumed-guard receipt check. Original-file preservation is separately verified in the private entry package. All remaining runner tests are retained. Production module source is unmodified.

The `rehearse.cjs` module generates labelled fixture examples if deliberately invoked with the network blocker; it is not a model call and is not invoked by the preparation workflow.
