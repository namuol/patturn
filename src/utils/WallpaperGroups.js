import Immutable from 'immutable';
import { Transform } from 'react-art';

export default Immutable.fromJS({
  p2: {
    transforms: function p2Transforms ({tileWidth, tileHeight}) {
      return [
        new Transform(),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(180).translate(-tileWidth/2,-tileHeight/2),
      ];
    },
    tilePosition: function p2TilePosition (num) {

    },
  },

  p3: {
    transforms: function p3Transforms ({tileWidth, tileHeight}) {
      return [
        new Transform(),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(120).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(240).translate(-tileWidth/2,-tileHeight/2),
      ];
    }
  },

  p4: {
    transforms: function p4Transforms ({tileWidth, tileHeight}) {
      return [
        new Transform(),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(90).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(180).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(270).translate(-tileWidth/2,-tileHeight/2),
      ];
    }
  },

  p6: {
    transforms: function p6Transforms ({tileWidth, tileHeight}) {
      return [
        new Transform(),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(60).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(120).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(180).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(240).translate(-tileWidth/2,-tileHeight/2),
        new Transform().translate(tileWidth/2,tileHeight/2).rotate(300).translate(-tileWidth/2,-tileHeight/2),
      ];
    }
  },
});
