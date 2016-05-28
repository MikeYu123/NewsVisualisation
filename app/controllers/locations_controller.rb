class LocationsController < ApplicationController
  before_filter :authenticate, only: :admin
  def more
    @response = []
    if params[:uuid]
      location_uuid = params[:uuid]
      metadata = $neo4j.execute_query("match (n:Location) where n.uuid = \'#{location_uuid}\' return n.name, labels(n)[1] limit 1")
      @name, place_type = metadata['data'][0]
      @prefix = match_prefix place_type
      if params[:is_today] && (params[:is_today] == 't')
        point = (Time.now - 24.hours).to_i
        query_results = $neo4j.execute_query("match (n:Article)--(m:Location) where m.uuid=\'#{location_uuid}\' and n.published_unixtime > #{point} return n")['data']
        @response = query_results.flatten.map{|x| x["data"]}
      else
        query_results = $neo4j.execute_query("match (n:Article)--(m:Location) where m.uuid=\'#{location_uuid}\' return n")['data']
        @response = query_results.flatten.map{|x| x["data"]}
      end
    end
  end

  def summary
    limit = params[:limit] || 10
    @summary = $neo4j.execute_query("match (n:Article)--(m:Location) return n.body, collect(m.name) limit #{limit}")['data']
    @summary.map!{|x| [x[0], x[1].map {|e| e.mb_chars.capitalize.to_s}.uniq]}
  end

  def admin
    @admin_data = $neo4j.execute_query("match (n:Article)--(m:Location) return n.uuid, n.body, m.name, labels(m)[1], m.uuid")['data']
    @admin_data.each{|x| x[3] = match_place_type(x[3])}
  end

  def delete_location
    location_uuid = params[:location_uuid]
    $neo4j.execute_query("match (m:Location) where m.uuid = \'#{location_uuid}\' detach delete m")
    redirect_to :back
  end

  def delete_relationships
    location_uuid = params[:location_uuid]
    article_uuid = params[:article_uuid]
    $neo4j.execute_query("match (m:Location)-[r:noted_in]->(n:Article) where m.uuid = \'#{location_uuid}\' and n.uuid = \'#{article_uuid}\' delete r")
    redirect_to :back
  end

  private
    def match_place_type place_type
      case place_type
      when 'Country'
        "Страна"
      when 'City'
        "Город"
      when 'Region'
        "Регион"
      when 'Subregion'
        "Подрегион"
      else
        "Локация"
      end
    end

    def match_prefix place_type
      case place_type
      when 'Country'
        "стране"
      when 'City'
        "городе"
      when 'Region'
        "регионе"
      when 'Subregion'
        "подрегионе"
      else
        "локации"
      end
    end


  def authenticate
    authenticate_or_request_with_http_basic do |username, password|
      username == ADMIN_USERNAME && Digest::SHA256.hexdigest(password+SALT) == ADMIN_TOKEN
    end
  end
end
