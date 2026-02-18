set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot
cd android
call gradlew.bat clean assembleRelease --console=plain --no-daemon
