Setup
-----

1. Make sure your `.boto` and `.aws/credentials` contains your crendentials
2. Add `export SERVER_PORT=<aPortNumber>` to your `.bashrc`
3. `make all`

Develop
-------

Use `make serve` to develop examples on localhost.

Deploy a branch
---------------

Branches are deployed in geoadmin integration bucket.
Use `make deploybranch` to upload templates and static files (js|css) to S3.
Make sure you pushed your changes to Github before deploying the branch.

When `DEEP_CLEAN` variable is set to `true`, the project is built from scratches.
