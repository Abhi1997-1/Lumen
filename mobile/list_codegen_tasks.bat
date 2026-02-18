@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.14.7-hotspot"
cd android
call gradlew.bat tasks --all --console=plain > ..\tasks_all.txt
type ..\tasks_all.txt | findstr /i codegen > ..\tasks_codegen.txt
