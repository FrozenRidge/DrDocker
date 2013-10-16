DrDocker
========

Tophat and monocle for your DockerD. [Docker.IO](http://docker.io) Node.JS library.


Installation
============

`npm install drdocker`


Usage
=====

Note: DrDocker uses the `docker` CLI tool. This tool typically needs to be run as root. Hence these examples should be run with root privileges.

## Check for an image

```javascript

var drdocker = require('drdocker')

function gotImage(err) {
  if (err) throw err
  console.log("image exists!")
}

drdocker.haveImage("frozenridge/drdocker", gotImage)
```

## Stream data into a container and commit result


```javascript

var drdocker = require('drdocker')
var resumer = require('resumer')

var img = "ubuntu"

function dataStreamed(code, cid) {
  var newImg = "helloWorld"
  drdocker.commit({
    containerId: cid,
    imageName: newImg,
  }, function(err) {
    console.log("Created image %s from result", newImg)
    console.log("Now try running `docker run -i helloWorld cat /tmp/test.txt`")
  })
}

function gotImage(err) {
  if (err) throw err
  console.log("image exists - streaming")
  var dataStream = resumer().queue("Hello World!\n").end()
  var proc = drdocker.runInContainer(img, "cat > /tmp/test.txt", true, dataStreamed)

  dataStream.pipe(proc.stdin)
}

drdocker.haveImage(img, gotImage)

```

Tests
=====

Requires root privileges and a local docker.

Run with `npm test`


License
=======

BSD
