export default function(kapsulePropName, kapsuleType) {

  const dummyK = new kapsuleType(); // To extract defaults
  dummyK._destructor && dummyK._destructor();

  return {
    linkProp: function(prop) { // link property config
      return {
        default: dummyK[prop](),
        onChange(v, state) { state[kapsulePropName][prop](v) },
        triggerUpdate: false
      }
    },
    linkMethod: function(method) { // link method pass-through
      return function(state, ...args) {
        const kapsuleInstance = state[kapsulePropName];
        const returnVal = kapsuleInstance[method](...args);

        return returnVal === kapsuleInstance
          ? this // chain based on the parent object, not the inner kapsule
          : returnVal;
      }
    }
  }

}