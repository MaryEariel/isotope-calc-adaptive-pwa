local keys = redis.call('KEYS', 'session:*')
local users = {}

for i, key in ipairs(keys) do
    local data = redis.call('GET', key)
    if data then
        local username = string.match(data, '"username"%s*:%s*"([^"]+)"')
        if username then
            if not users[username] then
                users[username] = {sessions = {}}
            end
            table.insert(users[username].sessions, key)
        end
    end
end

return users