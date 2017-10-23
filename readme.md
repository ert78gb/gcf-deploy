Google Cloud Functions deploy wrapper
=====================================

This is a small library that helps to deploy Google Functions without installing Google SDK.
The main goal is to support deployment with binary dependencies.

**!!! Important !!!** I have created the tool in a hurry so it does not contain all functionality supported by [API](https://cloud.google.com/functions/docs/reference/rest/v1beta2/projects.locations.functions)
As soon as I need these features I will implement them and add more unit tests :)

The tool works with the following steps:
  - copy all deployment files in one directory
  - zip all files
  - create a storage bucket if not exist
  - upload the zip file
  - create or update functions

## How to use

```javascript
const deploy = require('gcf-deploy');

  const deployOption = {
    credentials: path.resolve(__dirname, './google-credential.json'), // absolute path of the google credential file
    projectId: 'project-id', // Google Cloud project ID where the function will be deployed
    globs: [ // which files should be deployed
      'node_modules/**', // the whole node_modules except dev dependencies.
      'src/**/!(*.spec).js' // all files in src folder except spec files
    ],
    bucket: 'bucket-name', // which bucket should contains the zip files
    func: {
      entryPoint: 'helloWorld', // entry point of the function
      description: 'gcf-deploy sample function', // description of the function
      timeout: '15s', // running timeout
      availableMemoryMb: 128 // max available memory to the function
    },
    overwrite: true // overwrite the deployment file if that exists in the bucket
  };

deploy(deployOption)
  .then(result=>{
    // do something
  })
  .catch(error=>{
    // ooh error :(
  });
```

## Related to
 - https://github.com/serverless/serverless-google-cloudfunctions
 
