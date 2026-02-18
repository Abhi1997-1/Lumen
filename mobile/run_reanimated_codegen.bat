@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot"
cd android
call gradlew.bat :react-native-reanimated:generateCodegenArtifactsFromSchema --info --rerun-tasks > ..\reanimated_codegen_log.txt 2>&1
