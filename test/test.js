var expect = require('chai').expect
var provision = require('../index.js')
var resumer = require('resumer')

if (process.getuid() !== 0) {
  console.log("ERROR: must run tests with root privileges")
  console.log()
  process.exit(1)
}

describe('#haveImage', function() {
  it('should return true if ubuntu image exists', function(done) {
    provision.haveImage("ubuntu", function(err) {
      expect(err).to.be.null
      done()
    })
  })

  it("should return false if random image doesn't exist", function(done) {
    provision.haveImage("zzz%%3234;;", function(err) {
      expect(err).to.exist
      done()
    })
  })

})

describe("#runInContainer", function() {
  it("should correctly run commands", function(done) {
    var proc = provision.runInContainer("ubuntu", "ps aux", function(code, cid, stdout, stderr) {
      expect(code).to.eql(0)
      expect(cid).to.exist
      expect(stdout).to.have.length.above(0)
      done()
    })
  })

  it("should correctly stream to container command", function(done) {
    var testString = "@@TEST_STRING@@" + Math.floor(Math.random() * 1000000)
    var testImageName = "TESTIMAGE/" + Math.floor(Math.random() * 10000)
    var testStream = resumer().queue(testString).end()

    var proc = provision.runInContainer("ubuntu", "cat > /tmp/test.txt", true, function(code, cid) {
      expect(code).to.eql(0)
      expect(cid).to.exist
      provision.commit({
        containerId: cid,
        imageName: testImageName,
      }, function(err) {
        expect(err).to.be.null
        provision.runInContainer(testImageName, "cat /tmp/test.txt", function(code, cid, stdout) {
          expect(stdout).to.eql(testString)
          done()
        })
      })
    })

    testStream.pipe(proc.stdin)

  })



})
