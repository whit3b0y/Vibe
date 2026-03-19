require 'webrick'
port = ENV['PORT'] || 8080
server = WEBrick::HTTPServer.new(:Port => port.to_i, :DocumentRoot => Dir.pwd)
trap('INT') { server.shutdown }
server.start
