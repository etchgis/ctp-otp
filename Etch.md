# Etch instructions and modifications

## Using an IDE

First, read the [Developer's Guide](https://docs.opentripplanner.org/en/latest/Developers-Guide/) and set up an environment with IntelliJ IDEA.

0. Etch recommends having the Temurin JDK installed, you can do this with Brew on macOS:
```sh
brew install --cask temurin21
```
1. Download [IntelliJ IDEA Community Edition](https://www.jetbrains.com/idea/) from JetBrains.
2. Open the code folder, wait for indexing to complete.
3. Go to File > Project Structure and specify the SDK, or download one. This should be Java 21.
4. Open View > Tool Windows > Maven and run the package task.
5. Open Run > Edit Configurations... > Add new run configuration... and choose JAR Application.
6. Name the configuration "Build Graph" and choose the `target/otp-VERSION-SNAPSHOT-shaded.jar` file. If this isn't present, the package task may not have succeeded. Specify `-Xmx6G` for VM options and `--build /Users/.../graph --save` for program arguments. Run it.
7. Name the configuration "Run OTP" and choose the same JAR file file. Specify `-Xmx2G` for VM options and `--load /Users/.../graph` for program arguments. Run it.
8. Open `http://localhost:8080` in your browser.

## Manual CLI tools

The main command you'll want to use is `mvn package` which will compile the code, run the tests, and package the build artifacts to create a JAR file at `target/otp-VERSION-SNAPSHOT-shaded.jar`. The JAR file can then be run or deployed as needed.

Other commands to know:

  - `mvn clean`: Clean up build artifacts from a previous build on your machine.
  - `mvn compile`: Run the compile step only.
  - `mvn test`: Run the test step only.

You can combine multiple commands:

  - `mvn clean package`

You can run a command while skipping a step:

  - `mvn package -DskipTests`

## Build the graph

You must have a directory for graph data that contains and OSM file and the required GTFS file(s).

Run the following to build and save the graph wherever the graph files are located:

```sh
java -Xmx6G -jar otp-2.6.0.jar --build ~/my_graphs/graph --save
```

## Run the OpenTripPlanner server

Once a graph is build, you can load and run it with less RAM required:

```sh
java -Xmx2G -jar otp-2.6.0.jar --load ~/my_graphs/graph
```
