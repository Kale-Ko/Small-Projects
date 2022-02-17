#include <iostream>
#include <windows.h>
using namespace std::string_literals;

std::string fixCmd(std::string &SRC)
{
    std::string ret;
    char ch;
    int i, ii;

    for (i = 0; i < int(SRC.length()); i++)
    {
        if (int(SRC[i]) == 37)
        {
            sscanf_s(SRC.substr(i + 1, 2).c_str(), "%x", &ii);
            ch = static_cast<char>(ii);
            ret += ch;
            i = i + 2;
        }
        else
            ret += SRC[i];
    }

    return (ret);
}

int main(int argc, char *argv[])
{
    STARTUPINFO si;
    PROCESS_INFORMATION pi;

    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    if (argc != 2)
    {
        printf("Usage: cmdp.exe [cmd]\n");

        return -1;
    }

    std::string cmd = std::string(argv[1]).replace(0, 6, "");
    cmd.replace(cmd.length() - 1, 1, "");
    cmd = fixCmd(cmd);

    std::string launchcmd = "cmd.exe /C \"start cmd.exe /K \"echo %cd%^>"s + cmd + " && "s + cmd + "\"\"\n"s;

    if (!CreateProcess(NULL, const_cast<char *>(launchcmd.c_str()), NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi))
    {
        printf("CreateProcess failed (%d)\n", GetLastError());

        return -1;
    }

    WaitForSingleObject(pi.hProcess, INFINITE);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return 0;
}