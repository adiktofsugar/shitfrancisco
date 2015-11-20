Shitfranciscosays.com
===

Is the most complicated simple website.

Hosted on s3, with aws gateway api and aws lambdas for functionality, that modifies the private s3 hosted posts.yaml, and then rebuilds index.html.

Scripts
---
*aws-install-assets.sh* syncs the public folder (excluding index.html) to s3
*aws-install-lambdas.sh* updates the lambdas to be current with the local
*build.js* Rebuilds the remote index.html based on the remote src/index.html file and remote posts.yaml file, then copies the built index.html file back down to public
*test-lambda.js* test local lambda functions in a fake amazon environment
