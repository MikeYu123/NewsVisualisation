class PointsController < ApplicationController
  def get_all_points
    @response = Hash.new
    query_results = $neo4j.execute_query('match (n:City) return n')['data']
    @response[:cities] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query('match (n:Subregion) return n')['data']
    @response[:subregions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query('match (n:Region) return n')['data']
    @response[:regions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query('match (n:Country) return n')['data']
    @response[:countries] = query_results.flatten.map{|x| x["data"]}
    render json:@response
  end

  def get_articles_for
    uuid = params[:uuid]
    query_results = $neo4j.execute_query("match (n:Article)--(m:Location) where m.uuid=\'#{uuid}\' return n limit 3")['data']
    @response = query_results.flatten.map{|x| x["data"]}
    render json: @response
  end

  def get_today_articles_for
    uuid = params[:uuid]
    point = (Time.now - 24.hours).to_i
    query_results = $neo4j.execute_query("match (n:Article)--(m:Location) where m.uuid=\'#{uuid}\' and n.published_unixtime > #{point} return n limit 3")['data']
    @response = query_results.flatten.map{|x| x["data"]}
    render json: @response
  end

  def search_for_point
    time_clause = ""
    search_phrase =  params[:search_phrase].to_s.mb_chars.downcase.to_s
    match_clause = ""
    if params[:is_completed] && (params[:is_completed] == "t")
      match_clause = "lower(n.name)=\'#{search_phrase}\'"
    else
      match_clause = "lower(n.name)=~\'.*#{search_phrase}.*\'"
    end
    if params[:is_today] && (params[:is_today] == "t")
      point = (Time.now - 24.hours).to_i
      time_clause = " and n.published_unixtime > #{point}"
    end
    query_string = "match (n:Location) where #{match_clause}#{time_clause} return n"
    query_results = $neo4j.execute_query(query_string)
    @response = query_results['data'].map{|x| x[0]['data']}
    @response.each{|x| x['name'] = x['name'].mb_chars.downcase.to_s}
    render json: @response
  end

  def get_today_points
    point = (Time.now - 24.hours).to_i
    @response = Hash.new
    query_results = $neo4j.execute_query("match (n:City)--(m:Article) where m.published_unixtime > #{point} return n")['data']
    @response[:cities] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Subregion)--(m:Article) where m.published_unixtime > #{point} return n")['data']
    @response[:subregions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Region)--(m:Article) where m.published_unixtime > #{point} return n")['data']
    @response[:regions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Country)--(m:Article) where m.published_unixtime > #{point} return n")['data']
    @response[:countries] = query_results.flatten.map{|x| x["data"]}
    render json: @response
  end

  def get_autocomplete_choices_all
    @response = $neo4j.execute_query('match (n:Location) return n.name')['data'].flatten.map{|x| x.mb_chars.capitalize.to_s}
    render json: @response
  end

  def get_autocomplete_choices_today
    point = (Time.now - 24.hours).to_i
    @response = $neo4j.execute_query("match (n:Location)--(m:Article) where m.published_unixtime > #{point} return n.name")['data'].flatten.map{|x| x.mb_chars.capitalize.to_s}
    render json: @response
  end



  def get_in_region
    lat_min = params[:lat_min]
    lng_min = params[:lng_min]
    lat_max = params[:lat_max]
    lng_max = params[:lng_max]
    @response = Hash.new
    query_results = $neo4j.execute_query("match (n:City) where n.lat > #{lat_min} and n.lat < #{lat_max} and n.lng > #{lng_min} and n.lng < #{lng_max} return n")['data']
    @response[:cities] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Subregion) where n.lat > #{lat_min} and n.lat < #{lat_max} and n.lng > #{lng_min} and n.lng < #{lng_max} return n")['data']
    @response[:subregions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Region) where n.lat > #{lat_min} and n.lat < #{lat_max} and n.lng > #{lng_min} and n.lng < #{lng_max} return n")['data']
    @response[:regions] = query_results.flatten.map{|x| x["data"]}
    query_results = $neo4j.execute_query("match (n:Country) where n.lat > #{lat_min} and n.lat < #{lat_max} and n.lng > #{lng_min} and n.lng < #{lng_max} return n")['data']
    @response[:countries] = query_results.flatten.map{|x| x["data"]}
    render json: @response
  end
end
