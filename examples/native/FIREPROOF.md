# React Native Fireproof Example

## Create a new app from template

See (https://reactnative.dev/docs/environment-setup)[https://reactnative.dev/docs/environment-setup] but replace `yarn` with `pnpm`.

    pnpx react-native@latest init fireproof

You would think this uses `pnpm` the whole way.  It doesn't.  So we need to un-`yarn`-ify things.

    rm -rf android/.gradle/ android/app/build android/local.properties ios/Pods/ ios/Podfile.lock ios/build/ node_modules/
    rm yarn.lock

    # pnpm config --location project set hoist false
    # pnpm config --location project set shamefully-hoist true
    # pnpm config --location project set node-linker hoisted
    # instead of ^ make the following:
    ❯ cat .npmrc
    public-hoist-pattern[]=*eslint*
    public-hoist-pattern[]=*prettier*
    public-hoist-pattern[]=*react-native*
    public-hoist-pattern[]=*metro*

    pnpm add -D open @react-native-community/cli-platform-ios @react-native-community/cli-platform-android
    pnpm install

    cd ios
    pod install
    cd ..
