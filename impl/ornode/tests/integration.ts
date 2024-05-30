import { expect } from "chai";

describe("ornode", function() {
  describe("initial state", function() {
    describe("launch when contracts have already been running", function() {
      describe("getProposals", function() {
        it("should return proposals already made, but without their memo objects")
        it("should return proposals already made, but without their objects for mints")
        it("should return proposals already made, but without their objects for burns")
        it("should return proposals already made, but without their objects for signals")

        it("should return proposals already made, with their memo objects if someone submits them")
        it("should return proposals already made, with their objects for mints, if someone submits them")
        it("should return proposals already made, with their objects for burns if someone submits them")
        it("should return proposals already made, with their objects for signals if someone submits them")
      })
    })

    describe("getPeriodNum", function() {
      it("should return periodNumber equal to number of tick signals emitted")
    });

    describe("token/{id}", function() {
      it("should return token metadata for fungible respect");
      it("should return token metadata for non-fungible respect")
    });
  });

  describe("relaunch", function() {
    describe("relaunch after pause while contracts progressed", function() {
      it("should return new proposals, but without their memo objects")
      it("should return new proposals, but without their objects for mints")
      it("should return new proposals, but without their objects for burns")
      it("should return new proposals, but without their objects for signals")

      it("should return new proposals, with their memo objects if someone submits them")
      it("should return new proposals, with their objects for mints, if someone submits them")
      it("should return new proposals, with their objects for burns if someone submits them")
      it("should return new proposals, with their objects for signals if someone submits them")
    })

    describe("getPeriodNum", function() {
      it("should return periodNumber equal to number of tick signals emitted")
    });

    describe("token/{id}", function() {
      it("should return token metadata for fungible respect");
      it("should return token metadata for non-fungible respect")
    });

  });

  describe("operation", function() {
    // TODO: test that all the expected objects are returned
    describe("creating proposals", function() {
      describe("submitting proposal to distribute respect for breakout room")
      describe("submitting proposal to burn respect of whole breakout room")
      describe("submitting proposal to mint respect for individual account")
      describe("submitting proposal to burn respect of individual account")
      describe("submitting proposal to increment period number")
      describe("submitting proposal to issue a signal with a doc (passed proposal)")
    })

    describe("passing proposals", function() {
      describe("passing proposal to distribute respect for breakout room")
      describe("passing proposal to burn respect of whole breakout room")
      describe("passing proposal to mint respect for individual account")
      describe("passing proposal to burn respect of individual account")
      describe("passing proposal to issue a signal with a doc (passed proposal)")
      describe("passing proposal to increment period number")
    });

    describe("executing proposals", function() {
      // TODO: this is where you check
      // * if token/{id} returns
      describe("executing proposal to distribute respect for breakout room", function() {
        // TODO: execute
        it("should return token metadata for the new tokens")
      });
      describe("executing proposal to burn respect of whole breakout room", function() {
        it("should stop returning token metadata for the burned tokens")
      })
      describe("executing proposal to mint respect for individual account", function() {
        it("should return token metadata for the new tokens")
      })
      describe("executing proposal to burn respect of individual account", function() {
        it("should stop returning token metadata for the burned tokens")
      })
      describe("executing proposal to issue a signal with a doc (passed proposal)")
      describe("executing proposal to increment period number", function() {
        it("should return the updated period number")
      })
    });
  });

  describe("operation with missing objects", function() {
    // TODO: a lot of same checks from "executing proposals" group
    describe("creating proposals", function() {
      describe("submitting proposal to distribute respect for breakout room")
      describe("submitting proposal to burn respect of whole breakout room")
      describe("submitting proposal to mint respect for individual account")
      describe("submitting proposal to burn respect of individual account")
      describe("submitting proposal to increment period number")
      describe("submitting proposal to issue a signal with a doc (passed proposal)")
    })

    describe("passing proposals", function() {
      // TODO: a lot of same checks from "executing proposals" group
      describe("passing proposal to distribute respect for breakout room")
      describe("passing proposal to burn respect of whole breakout room")
      describe("passing proposal to mint respect for individual account")
      describe("passing proposal to burn respect of individual account")
      describe("passing proposal to issue a signal with a doc (passed proposal)")
      describe("passing proposal to increment period number")
    });

    describe("executing proposals", function() {
      describe("executing proposal to distribute respect for breakout room", function() {
        // TODO: execute
        it("should return token metadata for the new tokens")
        it("should not return missing memo object until someone submits it")
        it("should not return missing mint object until someone submits it")
      });
      describe("executing proposal to burn respect of whole breakout room", function() {
        it("should stop returning token metadata for the burned tokens")
        it("should not return missing memo object until someone submits it")
        it("should not return missing burn object until someone submits it")
      })
      describe("executing proposal to mint respect for individual account", function() {
        it("should return token metadata for the new tokens (with reason field empty)")
        it("should not return missing memo object until someone submits it")
        it("should not return missing mint object until someone submits it")
      })
      describe("executing proposal to burn respect of individual account", function() {
        it("should stop returning token metadata for the burned tokens")
        it("should not return missing memo object until someone submits it")
        it("should not return missing burn object until someone submits it")
      })
      describe("executing proposal to issue a signal with a doc (passed proposal)", function() {
        it("should not return signal data until someone submits it")
      });
      describe("executing proposal to increment period number", function() {
        it("should return the updated period number")
      })
    });
  })
});
