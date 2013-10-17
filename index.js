var fs = require('fs')
  , os = require('os')
  , path = require('path')
  , sh = require('child_process').exec
  , spawn = require('child_process').spawn

//  haveImage() - Does an image exist in Docker
//
//  *imageName* - Name of image to look for
//  *cb* - function callback function(err) {}
//
var haveImage = function(imageName, cb) {
  sh('docker images  | cut -d " " -f 1', function(err, res){
    if (err) {
      return cb(new Error("error listing docker images: " + err), null)
    }
    if (res.indexOf(imageName) == -1){
      return cb(new Error("image not found: " + imageName), null)
    }
    cb(null, null)
  })
}

//  commit() - Commit an image to docker
//
//  *opts* is an object with params:
//      *imageName* - name of image to commit as
//      *tag* - tag to commit as (default: latest)
//      *containerId* - container id to commit
//      *cmd* - Cmd to commit
//      *ports* - Ports to expose
//      *message* - Commit message
//      *author* - Commit author
//
//  *cb* is a function callback function(err) {}
//
var commit = function(opts, cb) {
  if (!opts) {
    return cb(new Error("must specify options object"))
  }
  if (!opts.imageName) {
    return cb(new Error("must specify imageName"))
  }
  if (!opts.containerId) {
    return cb(new Error("must specify containerId"))
  }
  var tag = opts.tag || "latest"
  var run = []
  var cmd = "docker commit "
  if (typeof opts.cmd === 'string') {
    run = ["/bin/bash", "-c"].concat(opts.cmd.split(' '))
  }
  if (Array.isArray(opts.cmd)) {
    run = opts.cmd
  }
  var ports = opts.ports || []
  var message = opts.message || ""
  var author = opts.author || "StriderCD Provisioning Service <hi@stridercd.com>"

  if (run || ports) {
    var runStr = JSON.stringify({Cmd: run, PortSpecs: ports})
    cmd += "-run='" + runStr + "' "
  }
  if (message) {
    cmd += "-m='" + message + "' "
  }
  if (author) {
    cmd += "-author='" + author + "' "
  }
  cmd += opts.containerId + " " + opts.imageName + " " + tag
  console.log("DEBUG: running cmd ", cmd)
  sh(cmd, cb)
}

//  kill() - Kill a running docker container.
//
//  *containerId* - ID of container to kill
//  *cb* - function callback function(err) {}
//
var kill = function(containerId, cb) {
  sh("docker kill " + containerId, function(err, stdout, stderr) {
    cb(err, stdout + stderr)
  })
}


//  runInContainer() - Run a command in a container.
//
//  *imageName* - Name of image
//  *cmd* - Command to stream from, running inside container
//  *piping* - If you are piping into stdin, you must set to true (optional)
//  *cb* - Called when sub-process completes. Function callback function(exitCode, containerId, stdout, stderr) {}
//
//  returns a ChildProcess object.
//
var runInContainer = function(imageName, cmd, pipingToStdin, cb) {
  var stdout = ""
  var stderr = ""
  var cidFile = path.join("/tmp", "provisioning_" + process.pid.toString() + ".cid")
  var proc = spawn("docker", ["run", "-cidfile", cidFile, "-t", "-i", "-a", "stdin", "-a", "stdout", "-a", "stderr",
    imageName, '/bin/bash', '-c', cmd ])

  if (arguments.length === 3)  {
    cb = pipingToStdin
    pipingToStdin = false
  }

  proc.stdout.setEncoding('utf8')
  proc.stderr.setEncoding('utf8')

  proc.stdout.on('data', function(data) {
    stdout += data
  })

  proc.stderr.on('data', function(data) {
    stderr += data
  })

  proc.on('close', function(code) {
    var cid = fs.readFileSync(cidFile, 'utf8')
    cid = cid.replace('\n', '')
    fs.unlink(cidFile, function() {
      cb(code, cid, stdout, stderr)
    })
  })

  if (!pipingToStdin) proc.stdin.end()

  return proc
}

module.exports = {
  haveImage: haveImage,
  commit: commit,
  kill: kill,
  runInContainer: runInContainer
}

