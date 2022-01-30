cmake_minimum_required(VERSION 3.0.0)
enable_language(CXX)
project(cmdp VERSION 1.0.0 DESCRIPTION "CMD Protocol")

add_executable(${PROJECT_NAME} main.cpp "${CMAKE_CURRENT_SOURCE_DIR}/icon.rc")

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)