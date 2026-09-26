local sessionIds = redis.call('SMEMBERS', KEYS[1])
local removed = 0
for _, sessionId in ipairs(sessionIds) do
  local sessionKey = ARGV[1] .. sessionId
  local deviceId = redis.call('HGET', sessionKey, 'deviceId')
  if deviceId then
    local deviceKey = ARGV[2] .. deviceId
    if redis.call('GET', deviceKey) == sessionId then
      redis.call('DEL', deviceKey)
    end
  end
  removed = removed + redis.call('DEL', sessionKey)
end
redis.call('DEL', KEYS[1])
return removed
